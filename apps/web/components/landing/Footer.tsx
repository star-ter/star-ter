// import { Mail, MapPin, Phone } from 'lucide-react';
import { Logo } from './header/Logo';

export function Footer() {
  return (
    <footer className="bg-background border-t border-border pt-20 pb-10 px-6">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="grid grid-cols-1 gap-12 mb-16">
          <div className="space-y-6">
            <Logo />
            <br />
            <p className="text-muted-foreground text-body leading-relaxed">
              지리응답은 빅데이터와 AI 기술을 활용하여 예비 창업자와
              소상공인에게
              <br />
              가장 정밀한 상권 분석 정보를 제공합니다.
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-caption text-muted-foreground">
          <p>© 2026 지리응답 Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
