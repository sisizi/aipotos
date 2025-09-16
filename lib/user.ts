/**
 * User management utilities
 */

import { supabase, supabaseAdmin } from './supabase'
import { UserRow, UserInsert, UserUpdate, DatabaseResponse } from './types'

export class UserService {
  static async getCurrentUser(userId: string): Promise<DatabaseResponse<UserRow>> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error: { message: 'Failed to fetch user', details: error } }
    }
  }

  static async getUserByEmail(email: string): Promise<DatabaseResponse<UserRow>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error: { message: 'Failed to fetch user by email', details: error } }
    }
  }

  static async createUser(userData: UserInsert): Promise<DatabaseResponse<UserRow>> {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .insert(userData)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error: { message: 'Failed to create user', details: error } }
    }
  }

  static async updateUser(userId: string, userData: UserUpdate): Promise<DatabaseResponse<UserRow>> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(userData)
        .eq('id', userId)
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error: { message: 'Failed to update user', details: error } }
    }
  }

  static async updateCredits(userId: string, credits: number): Promise<DatabaseResponse<UserRow>> {
    return this.updateUser(userId, { credits })
  }

  static async deductCredits(userId: string, amount: number): Promise<DatabaseResponse<UserRow>> {
    try {
      const currentUser = await this.getCurrentUser(userId)
      
      if (!currentUser.data) {
        return { data: null, error: { message: 'User not found' } }
      }

      const newCredits = Math.max(0, currentUser.data.credits - amount)
      return this.updateCredits(userId, newCredits)
    } catch (error) {
      return { data: null, error: { message: 'Failed to deduct credits', details: error } }
    }
  }

  static async addCredits(userId: string, amount: number): Promise<DatabaseResponse<UserRow>> {
    try {
      const currentUser = await this.getCurrentUser(userId)
      
      if (!currentUser.data) {
        return { data: null, error: { message: 'User not found' } }
      }

      const newCredits = currentUser.data.credits + amount
      return this.updateCredits(userId, newCredits)
    } catch (error) {
      return { data: null, error: { message: 'Failed to add credits', details: error } }
    }
  }

  static async upgradeUserLevel(userId: string, newLevel: 'free' | 'pro' | 'premium'): Promise<DatabaseResponse<UserRow>> {
    return this.updateUser(userId, { user_level: newLevel })
  }

  static async hasEnoughCredits(userId: string, requiredCredits: number): Promise<boolean> {
    try {
      const user = await this.getCurrentUser(userId)
      return user.data ? user.data.credits >= requiredCredits : false
    } catch (error) {
      console.error('Error checking credits:', error)
      return false
    }
  }

  static getCreditsForLevel(userLevel: 'free' | 'pro' | 'premium'): number {
    const creditLimits = {
      free: 100,
      pro: 1000,
      premium: 5000
    }
    return creditLimits[userLevel] || creditLimits.free
  }

  static getCreditCostForTask(taskType: 'generate' | 'edit' | 'enhance'): number {
    const taskCosts = {
      generate: 10,
      edit: 5,
      enhance: 8
    }
    return taskCosts[taskType] || taskCosts.generate
  }
}

// Utility function to format user display name
export function getUserDisplayName(user: Pick<UserRow, 'name' | 'email'>): string {
  return user.name || user.email.split('@')[0] || 'User'
}

// Utility function to check if user is premium
export function isPremiumUser(userLevel: string): boolean {
  return userLevel === 'premium'
}

// Utility function to check if user is pro or premium
export function isProUser(userLevel: string): boolean {
  return userLevel === 'pro' || userLevel === 'premium'
}