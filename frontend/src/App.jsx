import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Pokedex from './pages/Pokedex.jsx';
import PokemonDetail from './pages/PokemonDetail.jsx';
import Trainers from './pages/Trainers.jsx';
import TrainerDetail from './pages/TrainerDetail.jsx';
import Teams from './pages/Teams.jsx';
import TeamDetail from './pages/TeamDetail.jsx';
import Battles from './pages/Battles.jsx';
import Reports from './pages/Reports.jsx';
import Playground from './pages/Playground.jsx';
import Docs from './pages/Docs.jsx';
import ComingSoon from './pages/ComingSoon.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="pokedex" element={<Pokedex />} />
        <Route path="pokedex/:id" element={<PokemonDetail />} />
        <Route path="trainers" element={<Trainers />} />
        <Route path="trainers/:id" element={<TrainerDetail />} />
        <Route path="teams" element={<Teams />} />
        <Route path="teams/:id" element={<TeamDetail />} />
        <Route path="battles" element={<Battles />} />
        <Route path="reports" element={<Reports />} />
        <Route path="playground" element={<Playground />} />
        <Route path="docs" element={<Docs />} />
        <Route path="*" element={<ComingSoon title="404: nothing here" />} />
      </Route>
    </Routes>
  );
}