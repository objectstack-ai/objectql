import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import Image from 'next/image';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title:  (
       <div className="flex items-center gap-2 font-bold">
        <Image 
          src="https://objectstack.ai/logo.svg" 
          alt="ObjectStack Logo" 
          width={30} 
          height={30} 
        />
        ObjectQL
      </div>
    ),
    },
  };
}
