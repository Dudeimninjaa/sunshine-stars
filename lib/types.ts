export type Classroom = {
  id: string;
  name: string;
  created_by: string;
  invite_code: string;
  theme: string;
  sounds_enabled: boolean;
  kiosk_mode: boolean;
  animation_level: string;
  created_at: string;
};

export type Student = {
  id: string;
  classroom_id: string;
  team_id: string | null;
  name: string;
  avatar: string;
  total_points: number;
  created_at: string;
};

export type Team = {
  id: string;
  classroom_id: string;
  name: string;
  emoji: string;
  color: string;
  created_at: string;
};

export type CaptainHistory = {
  id: string;
  classroom_id: string;
  student_id: string;
  selected_date: string;
  created_at: string;
};

export type Category = {
  id: string;
  classroom_id: string;
  name: string;
  emoji: string;
  points: number;
  created_at: string;
};

export type ClassGoal = {
  id: string;
  classroom_id: string;
  name: string;
  reward_name: string;
  target_points: number;
  current_points: number;
  created_at: string;
};
