/**
 * Test endpoint to verify all modules load correctly
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Test importing all main services
    const { NanoBananaAPIService } = await import('@/services/nanoBananaAPI');
    const { DatabaseService } = await import('@/services/database');
    const { R2StorageService } = await import('@/services/r2Storage');

    // Test importing types
    const types = await import('@/types');

    // Test instantiation
    const nanoBananaService = new NanoBananaAPIService();
    const dbService = new DatabaseService();
    const r2Service = new R2StorageService();

    // Test getting available models
    const models = await nanoBananaService.getAvailableModels();

    return NextResponse.json({
      success: true,
      message: 'All modules loaded successfully',
      data: {
        availableModels: models,
        loadedServices: [
          'NanoBananaAPIService',
          'DatabaseService',
          'R2StorageService'
        ],
        typesCount: Object.keys(types).length
      }
    });

  } catch (error) {
    console.error('Module loading error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}