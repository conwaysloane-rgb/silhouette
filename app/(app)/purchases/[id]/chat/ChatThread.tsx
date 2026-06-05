'use client'

import { useEffect, useRef, useState } from 'react'
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
  purchaseId: string
  currentUserId: string
  listingTitle: string
  otherUser: { id: string; full_name: string; profile_photo_url: string | null }
  initialMessages: Message[]
}

const QUICK_REPLIES = [
  "When works for you?",
  "I can meet on campus 📍",
  "On my way!",
  "Where should we meet?",
  "Does tomorrow work?",
  "Just picked it up, thanks!",
]

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default function ChatThread({ purchaseId, currentUserId, listingTitle, otherUser, initialMessages }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const supabase = createClient()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const channel = supabase
      .channel(`purchase-chat-${purchaseId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `purchase_id=eq.${purchaseId}` },
        async (payload) => {
          const { data } = await supabase
            .from('messages')
            .select('id, content, created_at, sender_id, sender:users!sender_id(id, full_name, profile_photo_url)')
            .eq('id', payload.new.id)
            .single()
          if (data) {
            setMessages(prev => {
              if (prev.some(m => m.id === data.id)) return prev
              return [...prev, data as unknown as Message]
            })
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [purchaseId, supabase])

  async function sendMessage(content: string) {
    if (!content.trim() || sending) return
    setSending(true)

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
      .insert({ purchase_id: purchaseId, sender_id: currentUserId, content: content.trim() })
      .select('id, content, created_at, sender_id')
      .single()

    if (!error && data) {
      setMessages(prev => prev.map(m => m.id === optimistic.id ? { ...m, id: data.id } : m))
    } else {
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
          href={`/purchases/${purchaseId}`}
          className="w-9 h-9 flex items-center justify-center text-neutral-400 hover:text-neutral-900 transition flex-shrink-0"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <div className="w-9 h-9 bg-neutral-100 overflow-hidden flex items-center justify-center text-neutral-500 font-semibold text-sm flex-shrink-0">
          {otherUser.profile_photo_url
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={otherUser.profile_photo_url} alt="" className="w-full h-full object-cover" />
            : (otherUser.full_name?.[0] ?? '?').toUpperCase()
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-neutral-900 uppercase tracking-wide">{otherUser.full_name}</p>
          <p className="text-[11px] text-neutral-400 truncate">{listingTitle}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <p className="font-serif italic text-lg text-neutral-400 mb-1">No messages yet</p>
            <p className="text-[11px] text-neutral-400 uppercase tracking-widest">Coordinate handoff here</p>
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
                  className={`max-w-[75%] px-4 py-2.5 text-sm leading-relaxed ${
                    isMe
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-100 text-neutral-900'
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
              className="flex-shrink-0 text-[11px] text-neutral-600 border border-neutral-200 px-3 py-1.5 hover:border-neutral-900 hover:text-neutral-900 transition whitespace-nowrap uppercase tracking-wide"
            >
              {reply}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="px-3 pb-6 pt-2 border-t border-neutral-100 flex items-end gap-2 flex-shrink-0">
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message..."
          rows={1}
          className="flex-1 resize-none border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-neutral-400 transition max-h-28 overflow-y-auto"
          style={{ lineHeight: '1.4' }}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || sending}
          className="w-10 h-10 bg-neutral-900 flex items-center justify-center hover:bg-crimson disabled:opacity-40 disabled:cursor-not-allowed transition flex-shrink-0"
        >
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        </button>
      </div>
    </div>
  )
}
