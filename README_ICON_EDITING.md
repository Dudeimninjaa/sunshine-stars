# Sunshine Stars — Teams and Class Captains

Adds:
- Student teams/groups
- Team creation with emoji and color
- Assign students to teams
- Team scoreboard
- Team reward mode
- Class Captain Picker
- Picks 2 captains
- No-repeat captain mode
- Captain history saved in Supabase

## Important Supabase step

Run the updated `supabase/schema.sql` in Supabase SQL Editor.

This adds the `teams` table, `students.team_id`, and `captain_history` table.


## Delete classes

This version adds a Delete Classroom panel.

Safety:
- The teacher must type the exact class name.
- The browser asks for confirmation.
- Only the class creator can delete the classroom.
- Supabase cascading deletes remove related classroom data.

Run the updated `supabase/schema.sql` in Supabase SQL Editor to add the delete policy.


## Grade / class competitions

This version adds class competitions.

Features:
- Create a competition
- Join the selected class to a competition
- Shared leaderboard
- Scores update when rewards or negative points are given
- Classes can leave competitions

Run the updated `supabase/schema.sql` in Supabase SQL Editor before deploying.
