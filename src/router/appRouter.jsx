
import { Routes, Route } from 'react-router-dom';
import {Calculator,AdminScreen,UserScreen} from '../Screen/index';

const AppRoutes = () => (
    <Routes>
        <Route path="/" element={<Calculator />} />
        <Route path="/admin" element={<AdminScreen />} />
        <Route path="/user" element={<UserScreen />} />


    </Routes>
);

export default AppRoutes;