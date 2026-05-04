import { useState, useEffect, use } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from './useUser'; // Asumo que ya tienes este hook
import { updateUserStats, getUserData } from '../services/auth';

interface Stats {
    totalTime: number; // Tiempo total en minutos
   
}