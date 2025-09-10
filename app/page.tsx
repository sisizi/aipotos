import Header from './component/Header';
import HeroSection from './component/HeroSection';
import VideoSection from './component/VideoSection';
import UseCasesSection from './component/UseCasesSection';
import ProModelSection from './component/ProModelSection';
import TechSupportSection from './component/TechSupportSection';
import TestimonialsSection from './component/TestimonialsSection';
import Footer from './component/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      {/* 导航栏 */}
      <Header />
   
      {/* 主要内容 */}
      <main>

        
        {/* 英雄区域 */}
        <HeroSection />
        
        {/* 视频展示区 */}
        <VideoSection />
        
        {/* 使用场景 */}
        <UseCasesSection />
        
        {/* Pro/Max模型展示 */}
        <ProModelSection />
        
        {/* 技术支持 */}
        <TechSupportSection />
        
        {/* 用户评价 */}
        <TestimonialsSection />
      </main>
      
      {/* 页脚 */}
      <Footer />
    </div>
  );
}
