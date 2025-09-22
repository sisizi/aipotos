/**
 * 图片下载代理API - 解决CORS问题
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl, userId } = body;

    if (!imageUrl) {
      return NextResponse.json({
        success: false,
        error: 'Image URL is required',
      }, { status: 400 });
    }

    console.log('下载图片请求:', { imageUrl, userId });

    // 通过服务器端fetch获取图片，避免CORS问题
    const imageResponse = await fetch(imageUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    if (!imageResponse.ok) {
      console.error('获取图片失败:', imageResponse.status, imageResponse.statusText);
      return NextResponse.json({
        success: false,
        error: `Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`,
      }, { status: 500 });
    }

    // 获取图片数据
    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

    console.log('图片下载成功:', {
      size: imageBuffer.byteLength,
      contentType
    });

    // 返回图片数据，设置正确的headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': imageBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=31536000',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('Download image error:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }, { status: 500 });
  }
}

// 支持OPTIONS请求
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}