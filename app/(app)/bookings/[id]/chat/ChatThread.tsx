'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Message {
  id: string
  content: string
  created_at: string
  sender_id: string
  sender: { id: string; full_name: string; profile_photo_url: string | null } | null
}

interface Props {
  bookingId: string
  currentUserId: string
  listingTitle: string
  otherUser: { id: string; full_name: string; profile_photo_url: string | null }
  initialMessages: Message[]
}

const QUICK_REPLIES = [
  "Ready for pickup! 📍",
  "On my way!",
  "Where should we meet?",
  "Can we do tomorrow instead?",
  "Just returned it 👌",
  "Looks great, thanks!",
]

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) {
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default function ChatThread({ bookingId, currentUserId, listingTitle, otherUser, initialMessages }: Props) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const supabase = createClient()

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Supabase Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`chat-${bookingId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `booking_id=eq.${bookingId}` },
        async (payload) => {
          // Fetch the full message with sender info
          const { data } = await supabase
            .from('messages')
            .select('id, content, created_at, sender_id, sender:users!sender_id(id, full_name, profile_photo_url)')
            .eq('id', payload.new.id)
            .single()
          if (data) {
            setMessages(prev => {
              // Avoid duplicates (our own sends are optimistic)
              if (prev.some(m => m.id === data.id)) return prev
              return [...prev, data as unknown as Message]
            })
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [bookingId, supabase])

  async function sendMessage(content: string) {
    if (!content.trim() || sending) return
    setSending(true)

    // Optimistic insert
    const optimistic: Message = {
      id: `optimistic-${Date.now()}`,
      content: content.trim(),
      created_at: new Date().toISOString(),
      sender_id: currentUserId,
      sender: null,
    }
    setMessages(prev => [...prev, optimistic])
    setInput('')

    const { data, error } = await supabase
      .from('messages')
      .insert({ booking_id: bookingId, sender_id: currentUserId, content: content.trim() })
      .select('id, content, created_at, sender_id')
      .single()

    if (!error && data) {
      // Replace optimistic with real
      setMessages(prev => prev.map(m => m.id === optimistic.id ? { ...m, id: data.id } : m))
    } else {
      // Remove optimistic on error
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
    }

    setSending(false)
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-100 flex-shrink-0">
        <Link
          href={`/bookings/${bookingId}`}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-neutral-100 transition flex-shrink-0"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <div className="w-9 h-9 rounded-full bg-neutral-100 overflow-hidden flex items-center justify-center text-neutral-500 font-semibold flex-shrink-0">
          {otherUser.profile_photo_url
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={otherUser.profile_photo_url} alt="" className="w-full h-full object-cover" />
            : (otherUser.full_name?.[0] ?? '?').toUpperCase()
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-neutral-900">{otherUser.full_name}</p>
          <p className="text-xs text-neutral-500 truncate">{listingTitle}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-neutral-700">No messages yet</p>
            <p className="text-xs text-neutral-400 mt-1">Coordinate pickup and return here</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMe = msg.sender_id === currentUserId
          const prevMsg = messages[i - 1]
          const showTime = !prevMsg ||
            new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() > 5 * 60 * 1000

          return (
            <div key={msg.id}>
              {showTime && (
                <p className="text-center text-[10px] text-neutral-400 my-2">{formatTime(msg.created_at)}</p>
              )}
              <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isMe
                      ? 'bg-neutral-900 text-white rounded-br-md'
                      : 'bg-neutral-100 text-neutral-900 rounded-bl-md'
                  } ${msg.id.startsWith('optimistic') ? 'opacity-60' : ''}`}
                >
                  {msg.content}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Quick replies */}
      <div className="px-3 pb-2 flex-shrink-0">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {QUICK_REPLIES.map(reply => (
            <button
              key={reply}
              onClick={() => sendMessage(reply)}
              className="flex-shrink-0 text-xs text-neutral-600 border border-neutral-200 rounded-full px-3 py-1.5 hover:bg-neutral-50 hover:border-neutral-400 transition whitespace-nowrap"
            >
              {reply}
            </button>
          ))}
        </div>
      </div>

      {/* Input bar */}
      <div className="px-3 pb-6 pt-2 border-t border-neutral-100 flex items-end gap-2 flex-shrink-0">
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message..."
          rows={1}
          className="flex-1 resize-none rounded-2xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-neutral-400 transition max-h-28 overflow-y-auto"
          style={{ lineHeight: '1.4' }}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || sending}
          className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition flex-shrink-0"
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        </button>
      </div>
    </div>
  )
}
