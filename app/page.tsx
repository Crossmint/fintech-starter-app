import Image from "next/image";
import { HomeContent } from "@/app/home";

export default function Home() {
  return (
    <div className="flex h-screen flex-col py-3 sm:py-6 2xl:py-16">
      <main className="flex flex-1 flex-col items-center sm:items-start">
        <HomeContent />
      </main>
      <footer className="flex flex-col items-center justify-center gap-4">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-gray-500">
          <a
            className="flex items-center gap-2 transition-colors hover:text-gray-700 hover:underline hover:underline-offset-4"
            href="https://github.com/Crossmint/fintech-starter-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image aria-hidden src="/file.svg" alt="File icon" width={16} height={16} />
            View code
          </a>
          <a
            className="flex items-center gap-2 transition-colors hover:text-gray-700 hover:underline hover:underline-offset-4"
            href="https://crossmint.com/quickstarts"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image aria-hidden src="/window.svg" alt="Window icon" width={16} height={16} />
            See all quickstarts
          </a>
          <a
            className="flex items-center gap-2 transition-colors hover:text-gray-700 hover:underline hover:underline-offset-4"
            href="https://crossmint.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image aria-hidden src="/globe.svg" alt="Globe icon" width={16} height={16} />
            Go to crossmint.com →
          </a>
        </div>
        <div className="flex">
          <Image
            src="/crossmint-leaf.svg"
            alt="Powered by Crossmint"
            priority
            width={152}
            height={100}
          />
        </div>
      </footer>
    </div>
  );
}
