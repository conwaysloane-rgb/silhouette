-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── USERS ───────────────────────────────────────────────────────────────────
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text not null default '',
  university text,
  major text,
  grad_year smallint,
  profile_photo_url text,
  bio text,
  stripe_account_id text,
  terms_accepted_at timestamptz,
  created_at timestamptz default now() not null
);

alter table public.users enable row level security;

create policy "Users can view any profile"
  on public.users for select using (true);

create policy "Users can update their own profile"
  on public.users for update using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.users for insert with check (auth.uid() = id);

-- ─── LISTINGS ────────────────────────────────────────────────────────────────
create type public.category_type as enum ('formal', 'themed', 'going-out', 'interview', 'logo-wear');
create type public.size_type as enum ('XS', 'S', 'M', 'L', 'XL');

create table public.listings (
  id uuid default uuid_generate_v4() primary key,
  seller_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  description text,
  category public.category_type not null,
  size public.size_type not null,
  price_per_day numeric(8,2) not null check (price_per_day >= 5 and price_per_day <= 100),
  deposit_amount numeric(8,2) not null check (deposit_amount >= 0),
  is_paused boolean default false not null,
  is_deleted boolean default false not null,
  created_at timestamptz default now() not null
);

alter table public.listings enable row level security;

create policy "Anyone can view active listings"
  on public.listings for select using (is_deleted = false);

create policy "Sellers can insert their own listings"
  on public.listings for insert with check (auth.uid() = seller_id);

create policy "Sellers can update their own listings"
  on public.listings for update using (auth.uid() = seller_id);

-- ─── LISTING PHOTOS ──────────────────────────────────────────────────────────
create table public.listing_photos (
  id uuid default uuid_generate_v4() primary key,
  listing_id uuid references public.listings(id) on delete cascade not null,
  photo_url text not null,
  display_order smallint default 0 not null
);

alter table public.listing_photos enable row level security;

create policy "Anyone can view listing photos"
  on public.listing_photos for select using (true);

create policy "Sellers can manage their listing photos"
  on public.listing_photos for all using (
    auth.uid() = (select seller_id from public.listings where id = listing_id)
  );

-- ─── BOOKINGS ────────────────────────────────────────────────────────────────
create type public.booking_status as enum ('pending', 'confirmed', 'active', 'completed', 'cancelled');

create table public.bookings (
  id uuid default uuid_generate_v4() primary key,
  listing_id uuid references public.listings(id) not null,
  renter_id uuid references public.users(id) not null,
  pickup_date date not null,
  return_date date not null,
  total_rental_price numeric(8,2) not null,
  deposit_amount numeric(8,2) not null,
  platform_fee numeric(8,2) not null,
  stripe_payment_intent_id text,
  stripe_deposit_intent_id text,
  status public.booking_status default 'pending' not null,
  created_at timestamptz default now() not null,
  constraint valid_dates check (return_date > pickup_date)
);

alter table public.bookings enable row level security;

create policy "Renters and sellers can view their bookings"
  on public.bookings for select using (
    auth.uid() = renter_id or
    auth.uid() = (select seller_id from public.listings where id = listing_id)
  );

create policy "Renters can create bookings"
  on public.bookings for insert with check (auth.uid() = renter_id);

create policy "Sellers and renters can update bookings"
  on public.bookings for update using (
    auth.uid() = renter_id or
    auth.uid() = (select seller_id from public.listings where id = listing_id)
  );

-- Prevent double-booking: no overlapping confirmed/active bookings for same listing
create or replace function public.check_listing_availability(
  p_listing_id uuid,
  p_pickup date,
  p_return date,
  p_exclude_booking_id uuid default null
) returns boolean language sql security definer as $$
  select not exists (
    select 1 from public.bookings
    where listing_id = p_listing_id
      and status in ('confirmed', 'active')
      and id is distinct from p_exclude_booking_id
      and pickup_date < p_return
      and return_date > p_pickup
  );
$$;

-- ─── MESSAGES ────────────────────────────────────────────────────────────────
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  booking_id uuid references public.bookings(id) on delete cascade not null,
  sender_id uuid references public.users(id) not null,
  content text not null,
  created_at timestamptz default now() not null
);

alter table public.messages enable row level security;

create policy "Booking participants can view messages"
  on public.messages for select using (
    auth.uid() = sender_id or
    auth.uid() = (select renter_id from public.bookings where id = booking_id) or
    auth.uid() = (
      select u.id from public.users u
      join public.listings l on l.seller_id = u.id
      join public.bookings b on b.listing_id = l.id
      where b.id = booking_id
    )
  );

create policy "Booking participants can send messages"
  on public.messages for insert with check (
    auth.uid() = sender_id and (
      auth.uid() = (select renter_id from public.bookings where id = booking_id) or
      auth.uid() = (
        select l.seller_id from public.listings l
        join public.bookings b on b.listing_id = l.id
        where b.id = booking_id
      )
    )
  );

-- ─── REVIEWS ─────────────────────────────────────────────────────────────────
create table public.reviews (
  id uuid default uuid_generate_v4() primary key,
  booking_id uuid references public.bookings(id) not null,
  reviewer_id uuid references public.users(id) not null,
  reviewee_id uuid references public.users(id) not null,
  rating smallint not null check (rating between 1 and 5),
  body text,
  created_at timestamptz default now() not null,
  unique (booking_id, reviewer_id)
);

alter table public.reviews enable row level security;

create policy "Anyone can view reviews"
  on public.reviews for select using (true);

create policy "Booking participants can leave reviews"
  on public.reviews for insert with check (
    auth.uid() = reviewer_id and
    exists (
      select 1 from public.bookings
      where id = booking_id
        and status = 'completed'
        and (renter_id = auth.uid() or
             listing_id in (select id from public.listings where seller_id = auth.uid()))
    )
  );

-- ─── WAITLIST ─────────────────────────────────────────────────────────────────
create table public.waitlist (
  id uuid default uuid_generate_v4() primary key,
  email text not null unique,
  university text,
  created_at timestamptz default now() not null
);

alter table public.waitlist enable row level security;

create policy "Anyone can join the waitlist"
  on public.waitlist for insert with check (true);

-- ─── STORAGE BUCKETS ─────────────────────────────────────────────────────────
-- Run these in the Supabase dashboard Storage section or via CLI:
-- create bucket: listing-photos (public)
-- create bucket: profile-photos (public)

-- ─── FUNCTION: auto-create user profile on signup ────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
