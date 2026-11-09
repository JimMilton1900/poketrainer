import { useEffect, useState } from 'react';
import { NavLink, Outlet , Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Moon, Sun } from 'lucide-react';

const LINKS = [
  ['/', 'Dashboard'],
  ['/pokedex', 'Pokédex'],
  ['/trainers', 'Trainers'],
  ['/teams', 'Teams'],
  ['/battles', 'Battles'],
  ['/reports', 'Reports'],
  ['/playground', 'Playground'],
  ['/docs', 'Docs'],
];

export default function Layout() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'pokedex');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    // saves theme every time you refresh
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <div className="flex min-h-screen flex-col bg-base-200">
      <header className="border-b-4 border-neutral bg-primary text-primary-content">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
           <Link to={'/dashboard'}>
            <div className="pokeball size-8 shrink-0" />
          </Link>
           <span className="font-pixel text-xs sm:text-sm">Trainer's Terminal</span>
          <button
            className="btn btn-ghost btn-sm btn-circle ml-auto"
            onClick={() => setTheme(theme === 'pokedex' ? 'gameboy' : 'pokedex')}
            aria-label="Toggle theme"
          >
            {theme === 'pokedex' ? <Moon className="size-5" /> : <Sun className="size-5 text-white" />}
          </button>
        </div>
        <nav className="bg-neutral text-neutral-content">
          <ul className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-2 py-1">
            {LINKS.map(([to, label]) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `btn btn-sm btn-ghost whitespace-nowrap font-pixel text-[0.6rem] text-white ${
                      isActive ? 'bg-accent text-accent-content hover:bg-accent' : ''
                    }`
                  }
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet />
      </main>

      <footer className="bg-neutral px-4 py-4 text-center text-xs text-neutral-content">
        Unofficial fan project, made for coursework and not for profit. Pokémon and related names are
        trademarks of Nintendo, Game Freak and Creatures. Data from PokéAPI.
      </footer>

      <Toaster position="bottom-right" />
    </div>
  );
}