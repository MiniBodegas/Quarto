
import { Routes, Route } from 'react-router-dom';
import Calculator from '../Screen/index';

const AppRoutes = () => (
    <Routes>
        <Route path="/" element={<Calculator />} />

    </Routes>
);

export default AppRoutes;