import ThemeSelector from "@/components/theme-selector";

export function Navbar() {
  return (
    <nav className="border-b bg-background">
      <header className="sticky top-0 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="flex h-16 items-center px-4">
          <div className="ml-auto flex items-center space-x-4">
            <ThemeSelector />
          </div>
        </div>
      </header>
    </nav>
  );
}
