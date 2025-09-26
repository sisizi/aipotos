/**
 * User management utilities
 */

import { supabaseAdmin } from './supabase'
import { UserRow, UserInsert, UserUpdate, DatabaseResponse } from './types'

export class UserService {
  static async getCurrentUser(userId: string): Promise<DatabaseResponse<UserRow>> {
    try {
      const { data, error } = await supabaseAdmin
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
      const { data, error } = await supabaseAdmin
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

  static async upsertUserByEmail(
    email: string,
    userData: { name?: string; avatar?: string }
  ): Promise<DatabaseResponse<UserRow>> {
    try {
      const dbUserData: any = {
        email,
        updated_at: new Date().toISOString()
      }

      if (userData.name) {
        dbUserData.name = userData.name
      }

      if (userData.avatar) {
        dbUserData.avatar = userData.avatar
      }

      const { data, error } = await supabaseAdmin
        .from('users')
        .upsert(dbUserData, { onConflict: 'email' })
        .select()
        .single()

      return { data, error }
    } catch (error) {
      return { data: null, error: { message: 'Failed to upsert user', details: error } }
    }
  }
}

// Utility function to format user display name
export function getUserDisplayName(user: Pick<UserRow, 'name' | 'email'>): string {
  return user.name || user.email.split('@')[0] || 'User'
}

