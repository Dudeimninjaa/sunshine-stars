# Reliability Step 1

This version improves reliability.

## Fixed / Improved

- Competition scoring now uses a Supabase RPC function
- Individual rewards update competition scores
- Negative rewards subtract from competition scores
- Team rewards update competition scores by total team points
- Better error message if competition score update fails
- Reward messages show "Saved" confirmation

## Important

Run the updated `supabase/schema.sql` in Supabase SQL Editor before testing competition scores.
