import Header from '@/component/Header';
import HeroBanner from '@/component/HeroBanner';
import ImageEditorSection from '@/component/ImageEditorSection';
import UseCasesSection from '@/component/UseCasesSection';
import TestimonialsSection from '@/component/TestimonialsSection';
import Footer from '@/component/Footer';
import MouseParticles from '@/component/MouseParticles';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      {/* 鼠标粒子效果 */}
      <MouseParticles />

      {/* 导航栏 */}
      <Header />

      {/* 主要内容 */}
      <main>
        {/* Hero Banner */}
        <HeroBanner />

        {/* 图像编辑区域 */}
        <ImageEditorSection />

        {/* 使用场景 */}
        <UseCasesSection />

        {/* 用户评价 */}
        <TestimonialsSection />
      </main>

      {/* 页脚 */}
      <Footer />
    </div>
  );
}

