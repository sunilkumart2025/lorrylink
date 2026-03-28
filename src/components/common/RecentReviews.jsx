import React from 'react';
import { Star, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

/**
 * Fetches the 5 most recent public reviews from Supabase.
 * Schema: reviews(id, booking_id, rating, comment, created_at)
 *   join: bookings(driver_id -> profiles(name), business_id -> profiles(name))
 */
async function fetchRecentReviews() {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      id,
      rating,
      comment,
      created_at,
      bookings (
        driver:profiles!bookings_driver_id_fkey ( name ),
        business:profiles!bookings_business_id_fkey ( name )
      )
    `)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) throw error;
  return data || [];
}

export default function RecentReviews() {
  const { data: reviews = [], isLoading, isError } = useQuery({
    queryKey: ['recent-reviews'],
    queryFn: fetchRecentReviews,
    staleTime: 1000 * 60 * 5, // cache for 5 minutes
  });

  if (isLoading) {
    return (
      <div className="mb-md" style={{ padding: '10px 0' }}>
        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto' }}>
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="card-glass"
              style={{
                minWidth: '260px',
                height: '110px',
                background: 'rgba(255,255,255,0.03)',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (isError || reviews.length === 0) {
    return (
      <div className="mb-md">
        <div className="flex items-center gap-sm mb-sm px-sm">
          <Star size={16} color="var(--color-warning)" fill="var(--color-warning)" />
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'rgba(255,255,255,0.6)', letterSpacing: '1px' }}>
            RECENT FEEDBACK
          </span>
        </div>
        <div className="card-glass" style={{ padding: '20px', textAlign: 'center' }}>
          <MessageSquare size={24} color="rgba(255,255,255,0.2)" style={{ margin: '0 auto 8px' }} />
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>
            No reviews yet — complete your first trip to earn feedback!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-md">
      <div className="flex items-center gap-sm mb-sm px-sm">
        <Star size={16} color="var(--color-warning)" fill="var(--color-warning)" />
        <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'rgba(255,255,255,0.6)', letterSpacing: '1px' }}>
          RECENT FEEDBACK
        </span>
        <span style={{
          marginLeft: 'auto',
          fontSize: '11px',
          background: 'rgba(255,255,255,0.06)',
          padding: '2px 8px',
          borderRadius: '10px',
          color: 'rgba(255,255,255,0.4)',
        }}>
          {reviews.length} reviews
        </span>
      </div>

      <div className="flex gap-md" style={{ overflowX: 'auto', paddingBottom: '10px' }}>
        {reviews.map((rev, idx) => {
          const reviewerName =
            rev.bookings?.business?.name ||
            rev.bookings?.driver?.name ||
            'Verified User';

          return (
            <motion.div
              key={rev.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="card-glass"
              style={{ minWidth: '260px', padding: '16px', flexShrink: 0 }}
            >
              {/* Stars + date */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', gap: '3px' }}>
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={12}
                      fill={i < rev.rating ? 'var(--color-warning)' : 'none'}
                      color={i < rev.rating ? 'var(--color-warning)' : 'rgba(255,255,255,0.2)'}
                    />
                  ))}
                </div>
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>
                  {rev.created_at
                    ? new Date(rev.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                    : 'Recent'}
                </span>
              </div>

              {/* Comment */}
              <p style={{
                fontSize: '13px',
                fontStyle: 'italic',
                marginBottom: '10px',
                color: 'rgba(255,255,255,0.85)',
                lineHeight: 1.5,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                "{rev.comment || 'Great service, smooth delivery!'}"
              </p>

              {/* Reviewer */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '24px', height: '24px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--color-primary), #22D3EE)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: '900', color: 'white', flexShrink: 0,
                }}>
                  {reviewerName[0]?.toUpperCase()}
                </div>
                <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-primary)' }}>
                  — {reviewerName}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
