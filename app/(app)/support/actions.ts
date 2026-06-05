'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Resend } from 'resend'

const REASON_LABELS: Record<string, string> = {
  'item-not-described':   'Item not as described',
  'item-damaged':         'Item damaged or missing',
  'no-show':              'Seller/Buyer no-show',
  'inappropriate':        'Inappropriate behavior',
  'payment':              'Payment or refund issue',
  'fraud':                'Listing fraud or scam',
  'other':                'Other',
}

export async function submitSupportTicket(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const reason = formData.get('reason') as string
  const message = formData.get('message') as string
  const orderRef = (formData.get('order_ref') as string) || null

  if (!reason || !message?.trim()) {
    redirect('/support?error=Please select a reason and describe your issue')
  }

  // Save to DB
  await supabase.from('support_tickets').insert({
    user_id: user.id,
    reason,
    message: message.trim(),
    order_ref: orderRef,
  })

  // Send email via Resend
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { data: profile } = await supabase
      .from('users')
      .select('full_name, email')
      .eq('id', user.id)
      .single()

    await resend.emails.send({
      from: 'Silhouette Support <onboarding@resend.dev>',
      to: 'conwaysloane@gmail.com',
      subject: `[Support] ${REASON_LABELS[reason] ?? reason}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
          <div style="background: #C8102E; padding: 24px 32px;">
            <h1 style="color: white; margin: 0; font-size: 20px; letter-spacing: 0.15em; text-transform: uppercase;">
              Silhouette — Support Ticket
            </h1>
          </div>
          <div style="padding: 32px; background: #fff; border: 1px solid #e5e5e5; border-top: none;">
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <tr>
                <td style="padding: 8px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #999; width: 120px;">From</td>
                <td style="padding: 8px 0; font-size: 14px;">${profile?.full_name ?? 'Unknown'} &lt;${profile?.email ?? user.email}&gt;</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #999;">Reason</td>
                <td style="padding: 8px 0; font-size: 14px; font-weight: bold;">${REASON_LABELS[reason] ?? reason}</td>
              </tr>
              ${orderRef ? `
              <tr>
                <td style="padding: 8px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #999;">Order / Booking</td>
                <td style="padding: 8px 0; font-size: 14px; font-family: monospace;">${orderRef}</td>
              </tr>` : ''}
            </table>
            <div style="border-top: 1px solid #e5e5e5; padding-top: 20px;">
              <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #999; margin: 0 0 8px;">Message</p>
              <p style="font-size: 14px; line-height: 1.6; white-space: pre-wrap; margin: 0;">${message.trim()}</p>
            </div>
          </div>
          <div style="padding: 16px 32px; background: #f9f9f9; border: 1px solid #e5e5e5; border-top: none;">
            <p style="font-size: 11px; color: #999; margin: 0; text-transform: uppercase; letter-spacing: 0.08em;">
              User ID: ${user.id}
            </p>
          </div>
        </div>
      `,
    })
  }

  redirect('/support?success=1')
}
