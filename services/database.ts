/**
 * 数据库服务
 */

import { supabaseAdmin } from '@/lib/supabase';
import { TaskRecord, DatabaseError } from '@/types';

/**
 * 数据库服务类，提供任务相关的数据库操作功能
 */
export class DatabaseService {
  /**
   * 创建新任务记录
   * @param task 任务数据
   * @returns 任务ID
   */
  async createTask(task: Omit<TaskRecord, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    try {
      // 记录创建任务日志，只显示部分敏感信息
      console.log('Creating new task:', {
        user_id: task.user_id,
        task_type: task.task_type,
        status: task.status,
        prompt_preview: task.input_prompt.substring(0, 50) + '...'
      });

      // 插入任务数据到数据库
      const { data, error } = await supabaseAdmin
        .from('tasks')
        .insert({
          user_id: task.user_id,
          task_type: task.task_type,
          status: task.status || 'pending',
          input_image_url: task.input_image_url,
          input_prompt: task.input_prompt,
          input_params: task.input_params || {},
          output_image_url: task.output_image_url,
          nano_banana_task_id: task.nano_banana_task_id,
          processing_time: task.processing_time,
          error_message: task.error_message,
          completed_at: task.completed_at,
        })
        .select('id')
        .single();

      // 处理数据库错误
      if (error) {
        console.error('Database error creating task:', error);
        throw new DatabaseError(
          `Failed to create task: ${error.message}`,
          error.code,
          { error, taskData: task }
        );
      }

      // 记录成功创建日志
      console.log(`Task created with ID: ${data.id}`);
      return data.id;
    } catch (error) {
      // 重新抛出已知错误或创建新的数据库错误
      if (error instanceof DatabaseError) {
        throw error;
      }
      console.error('Error creating task:', error);
      throw new DatabaseError(
        `Unexpected error creating task: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'UNKNOWN_ERROR',
        { error, taskData: task }
      );
    }
  }

  /**
   * 更新任务
   * @param taskId 任务ID
   * @param updates 更新数据
   */
  async updateTask(
    taskId: string, 
    updates: Partial<Omit<TaskRecord, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<void> {
    try {
      // 记录更新任务日志
      console.log(`Updating task ${taskId}:`, updates);
      
      // 构建更新数据对象，只包含提供的字段
      const updateData: Record<string, unknown> = {};
      
      // 只更新提供的字段
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.input_image_url !== undefined) updateData.input_image_url = updates.input_image_url;
      if (updates.input_prompt !== undefined) updateData.input_prompt = updates.input_prompt;
      if (updates.input_params !== undefined) updateData.input_params = updates.input_params;
      if (updates.output_image_url !== undefined) updateData.output_image_url = updates.output_image_url;
      if (updates.nano_banana_task_id !== undefined) updateData.nano_banana_task_id = updates.nano_banana_task_id;
      if (updates.processing_time !== undefined) updateData.processing_time = updates.processing_time;
      if (updates.error_message !== undefined) updateData.error_message = updates.error_message;
      if (updates.completed_at !== undefined) updateData.completed_at = updates.completed_at;

      // 执行更新操作
      const { error } = await supabaseAdmin
        .from('tasks')
        .update(updateData)
        .eq('id', taskId);

      // 处理数据库错误
      if (error) {
        console.error('Database error updating task:', error);
        throw new DatabaseError(
          `Failed to update task: ${error.message}`,
          error.code,
          { error, taskId, updates }
        );
      }

      // 记录成功更新日志
      console.log(`Task ${taskId} updated successfully`);
    } catch (error) {
      // 重新抛出已知错误或创建新的数据库错误
      if (error instanceof DatabaseError) {
        throw error;
      }
      console.error('Error updating task:', error);
      throw new DatabaseError(
        `Unexpected error updating task: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'UNKNOWN_ERROR',
        { error, taskId, updates }
      );
    }
  }

  /**
   * 获取用户的任务列表
   * @param userId 用户ID
   * @param limit 限制数量
   * @param offset 偏移量
   * @returns 任务列表
   */
  async getUserTasks(userId: string, limit: number = 20, offset: number = 0): Promise<TaskRecord[]> {
    try {
      // 记录获取任务列表日志
      console.log(`Getting tasks for user ${userId}, limit: ${limit}, offset: ${offset}`);
      
      // 查询用户任务
      const { data, error } = await supabaseAdmin
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // 处理数据库错误
      if (error) {
        console.error('Database error getting user tasks:', error);
        throw new DatabaseError(
          `Failed to get user tasks: ${error.message}`,
          error.code,
          { error, userId, limit, offset }
        );
      }

      // 记录获取结果
      console.log(`Retrieved ${data?.length || 0} tasks for user ${userId}`);
      return data || [];
    } catch (error) {
      // 重新抛出已知错误或创建新的数据库错误
      if (error instanceof DatabaseError) {
        throw error;
      }
      console.error('Error getting user tasks:', error);
      throw new DatabaseError(
        `Unexpected error getting user tasks: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'UNKNOWN_ERROR',
        { error, userId, limit, offset }
      );
    }
  }

  /**
   * 获取单个任务
   * @param taskId 任务ID
   * @param userId 用户ID（用于权限验证）
   * @returns 任务数据
   */
  async getTask(taskId: string, userId?: string): Promise<TaskRecord | null> {
    try {
      // 记录获取任务日志
      console.log(`Getting task ${taskId}${userId ? ` for user ${userId}` : ''}`);
      
      // 构建查询
      let query = supabaseAdmin
        .from('tasks')
        .select('*')
        .eq('id', taskId);

      // 如果提供了用户ID，添加用户验证
      if (userId) {
        query = query.eq('user_id', userId);
      }

      // 执行查询
      const { data, error } = await query.single();

      // 处理数据库错误
      if (error) {
        if (error.code === 'PGRST116') {
          // 记录不存在
          console.log(`Task ${taskId} not found`);
          return null;
        }
        console.error('Database error getting task:', error);
        throw new DatabaseError(
          `Failed to get task: ${error.message}`,
          error.code,
          { error, taskId, userId }
        );
      }

      // 记录成功获取日志
      console.log(`Task ${taskId} retrieved successfully`);
      return data;
    } catch (error) {
      // 重新抛出已知错误或创建新的数据库错误
      if (error instanceof DatabaseError) {
        throw error;
      }
      console.error('Error getting task:', error);
      throw new DatabaseError(
        `Unexpected error getting task: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'UNKNOWN_ERROR',
        { error, taskId, userId }
      );
    }
  }

  /**
   * 获取任务统计信息
   * @param userId 用户ID
   * @returns 统计数据
   */
  async getTaskStats(userId: string): Promise<{
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    try {
      // 记录获取统计信息日志
      console.log(`Getting task stats for user ${userId}`);
      
      // 查询用户任务状态
      const { data, error } = await supabaseAdmin
        .from('tasks')
        .select('status')
        .eq('user_id', userId);

      // 处理数据库错误
      if (error) {
        throw new DatabaseError(
          `Failed to get task stats: ${error.message}`,
          error.code,
          { error, userId }
        );
      }

      // 初始化统计数据
      const stats = {
        total: data.length,
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
      };

      // 统计各状态任务数量
      data.forEach((task) => {
        const status = task.status as keyof typeof stats;
        if (status in stats) {
          stats[status]++;
        }
      });

      // 记录统计结果
      console.log(`Task stats for user ${userId}:`, stats);
      return stats;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      console.error('Error getting task stats:', error);
      throw new DatabaseError(
        `Unexpected error getting task stats: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'UNKNOWN_ERROR',
        { error, userId }
      );
    }
  }

  /**
   * 删除任务
   * @param taskId 任务ID
   * @param userId 用户ID
   */
  async deleteTask(taskId: string, userId: string): Promise<void> {
    try {
      console.log(`Deleting task ${taskId} for user ${userId}`);
      
      const { error } = await supabaseAdmin
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .eq('user_id', userId);

      if (error) {
        throw new DatabaseError(
          `Failed to delete task: ${error.message}`,
          error.code,
          { error, taskId, userId }
        );
      }

      console.log(`Task ${taskId} deleted successfully`);
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      console.error('Error deleting task:', error);
      throw new DatabaseError(
        `Unexpected error deleting task: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'UNKNOWN_ERROR',
        { error, taskId, userId }
      );
    }
  }

  /**
   * 获取最近的任务
   * @param userId 用户ID
   * @param limit 限制数量
   * @returns 最近的任务列表
   */
  async getRecentTasks(userId: string, limit: number = 5): Promise<TaskRecord[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new DatabaseError(
          `Failed to get recent tasks: ${error.message}`,
          error.code,
          { error, userId, limit }
        );
      }

      return data || [];
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      console.error('Error getting recent tasks:', error);
      throw new DatabaseError(
        `Unexpected error getting recent tasks: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'UNKNOWN_ERROR',
        { error, userId, limit }
      );
    }
  }

  /**
   * 根据Nano Banana任务ID获取本地任务
   * @param nanoBananaTaskId Nano Banana任务ID
   * @returns 任务数据
   */
  async getTaskByNanoBananaId(nanoBananaTaskId: string): Promise<TaskRecord | null> {
    try {
      console.log(`Getting task by Nano Banana ID: ${nanoBananaTaskId}`);

      const { data, error } = await supabaseAdmin
        .from('tasks')
        .select('*')
        .eq('nano_banana_task_id', nanoBananaTaskId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // 记录不存在
          console.log(`Task with Nano Banana ID ${nanoBananaTaskId} not found`);
          return null;
        }
        console.error('Database error getting task by Nano Banana ID:', error);
        throw new DatabaseError(
          `Failed to get task by Nano Banana ID: ${error.message}`,
          error.code,
          { error, nanoBananaTaskId }
        );
      }

      console.log(`Task found for Nano Banana ID ${nanoBananaTaskId}: ${data.id}`);
      return data;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      console.error('Error getting task by Nano Banana ID:', error);
      throw new DatabaseError(
        `Unexpected error getting task by Nano Banana ID: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'UNKNOWN_ERROR',
        { error, nanoBananaTaskId }
      );
    }
  }

  /**
   * 检查数据库连接
   * @returns 连接状态
   */
  async healthCheck(): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('tasks')
        .select('id')
        .limit(1);

      return !error;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  /**
   * 清理过期的失败任务
   * @param daysOld 天数阈值
   * @returns 清理的任务数量
   */
  async cleanupOldFailedTasks(daysOld: number = 7): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { data, error } = await supabaseAdmin
        .from('tasks')
        .delete()
        .eq('status', 'failed')
        .lt('created_at', cutoffDate.toISOString())
        .select('id');

      if (error) {
        throw new DatabaseError(
          `Failed to cleanup old tasks: ${error.message}`,
          error.code,
          { error, daysOld }
        );
      }

      const count = data?.length || 0;
      console.log(`Cleaned up ${count} old failed tasks`);
      return count;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      console.error('Error cleaning up old tasks:', error);
      return 0;
    }
  }
}