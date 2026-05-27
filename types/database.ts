export type Category = 'formal' | 'themed' | 'going-out' | 'interview' | 'logo-wear'
export type Size = 'XS' | 'S' | 'M' | 'L' | 'XL'
export type BookingStatus = 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled'

export interface User {
  id: string
  email: string
  full_name: string
  university: string | null
  major: string | null
  grad_year: number | null
  profile_photo_url: string | null
  bio: string | null
  stripe_account_id: string | null
  terms_accepted_at: string | null
  created_at: string
}

export interface Listing {
  id: string
  seller_id: string
  title: string
  description: string | null
  category: Category
  size: Size
  price_per_day: number
  deposit_amount: number
  is_paused: boolean
  is_deleted: boolean
  created_at: string
  seller?: User
  photos?: ListingPhoto[]
}

export interface ListingPhoto {
  id: string
  listing_id: string
  photo_url: string
  display_order: number
}

export interface Booking {
  id: string
  listing_id: string
  renter_id: string
  pickup_date: string
  return_date: string
  total_rental_price: number
  deposit_amount: number
  platform_fee: number
  stripe_payment_intent_id: string | null
  stripe_deposit_intent_id: string | null
  status: BookingStatus
  created_at: string
  listing?: Listing
  renter?: User
}

export interface Message {
  id: string
  booking_id: string
  sender_id: string
  content: string
  created_at: string
  sender?: User
}

export interface Review {
  id: string
  booking_id: string
  reviewer_id: string
  reviewee_id: string
  rating: number
  body: string | null
  created_at: string
  reviewer?: User
}
