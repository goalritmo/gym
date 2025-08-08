import { useState } from 'react';
import { Box, Container } from '@mui/material';
import Navigation from '../navigation/Navigation';
import WorkoutForm from '../workout/WorkoutForm';
import ExerciseList from '../exercises/ExerciseList';
import EquipmentList from '../equipment/EquipmentList';
import WorkoutHistory from '../workout/WorkoutHistory';
import { useTab } from '../../contexts/TabContext';
import type { Workout, WorkoutSession } from '../../types/workout';

const mockWorkouts: Workout[] = [
  {
    id: 1,
    exercise_name: 'Press de Banca',
    weight: 80,
    reps: 10,
    serie: 1,
    seconds: null,
    observations: 'Felt strong today',
    exercise_session_id: 1,
    created_at: '2024-03-24T10:00:00Z'
  },
  {
    id: 2,
    exercise_name: 'Press de Banca',
    weight: 80,
    reps: 8,
    serie: 2,
    seconds: null,
    observations: null,
    exercise_session_id: 1,
    created_at: '2024-03-24T10:05:00Z'
  },
  {
    id: 3,
    exercise_name: 'Sentadillas',
    weight: 100,
    reps: 12,
    serie: 1,
    seconds: null,
    observations: 'Good form',
    exercise_session_id: 1,
    created_at: '2024-03-24T10:10:00Z'
  },
  {
    id: 4,
    exercise_name: 'Press de Banca',
    weight: 85,
    reps: 6,
    serie: 1,
    seconds: null,
    observations: null,
    exercise_session_id: 2,
    created_at: '2024-03-25T09:00:00Z'
  }
];

const mockWorkoutSessions: WorkoutSession[] = [
  {
    id: 1,
    session_date: '2024-03-24T00:00:00Z',
    session_name: 'Rutina de Fullbody',
    effort: 2,
    mood: 3,
    created_at: '2024-03-24T09:00:00Z'
  },
  {
    id: 2,
    session_date: '2024-03-25T00:00:00Z',
    session_name: 'Rutina de Fullbody',
    effort: 1,
    mood: 2,
    created_at: '2024-03-25T09:00:00Z'
  }
];

// Mock data para otros componentes
const mockExercises = [
  { 
    id: 1, 
    name: 'Press de Banca', 
    muscle_group: 'Pecho', 
    equipment: 'Barra',
    primary_muscles: ['Pectoral Mayor', 'Tríceps'],
    secondary_muscles: ['Deltoides Anterior', 'Serrato Anterior'],
    video_url: 'https://www.youtube.com/watch?v=rT7DgCr-3pg'
  },
  { 
    id: 2, 
    name: 'Sentadillas', 
    muscle_group: 'Piernas', 
    equipment: 'Barra',
    primary_muscles: ['Cuádriceps', 'Glúteos'],
    secondary_muscles: ['Isquiotibiales', 'Gastrocnemio', 'Core'],
    video_url: 'https://www.youtube.com/watch?v=aclHkVaku9U'
  }
];

const mockEquipment = [
  { id: 1, name: 'Barra Olímpica', category: 'pesas_libres', observations: 'Barra estándar', image_url: null, created_at: '2024-03-24T00:00:00Z' }
];

export default function AuthenticatedApp() {
  const { activeTab, setActiveTab } = useTab();
  const [workouts, setWorkouts] = useState<Workout[]>(mockWorkouts);
  const [workoutSessions, setWorkoutSessions] = useState<WorkoutSession[]>(mockWorkoutSessions);

  const handleDelete = (id: number) => {
    setWorkouts(prev => prev.filter(workout => workout.id !== id));
  };

  const handleUpdateSession = (sessionId: number, updates: Partial<WorkoutSession>) => {
    setWorkoutSessions(prev => prev.map(session => 
      session.id === sessionId ? { ...session, ...updates } : session
    ));
  };

  const handleWorkoutSubmit = (values: any) => {
    console.log('Workout submitted:', values);
  };

  const handleLogout = () => {
    console.log('Logout');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 0:
        return <WorkoutForm exercises={mockExercises} onSubmit={handleWorkoutSubmit} />;
      case 1:
        return <ExerciseList exercises={mockExercises} onSelectExercise={() => {}} />;
      case 2:
        return <EquipmentList equipment={mockEquipment} />;
      case 3:
        return (
          <WorkoutHistory 
            workoutSessions={workoutSessions}
            workouts={workouts}
            onDelete={handleDelete}
            onUpdateSession={handleUpdateSession}
          />
        );
      default:
        return <WorkoutForm exercises={mockExercises} onSubmit={handleWorkoutSubmit} />;
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 1 }}>
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} />
      <Box sx={{ mt: 2 }}>
        {renderContent()}
      </Box>
    </Container>
  );
}
