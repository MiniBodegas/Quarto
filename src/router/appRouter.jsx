// src/routes/AppRoutes.jsx
import { Routes, Route } from 'react-router-dom';
import { Calculator, AdminScreen, UserScreen, BookingTemplatePreview} from '../Screen/index';

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Calculator />} />
    <Route path="/admin" element={<AdminScreen />} />
    <Route path="/user" element={<UserScreen />} />
    <Route path="/booking-preview" element={<BookingTemplatePreview />} />


  </Routes>
);

export default AppRoutes;