import DirectoryExplorer from '@/components/DirectoryExplorer';

export default function Home() {
    return (
        <div className="flex min-h-screen w-full items-start justify-center bg-zinc-100 px-4 py-12 font-sans dark:bg-zinc-950">
            <DirectoryExplorer />
        </div>
    );
}
