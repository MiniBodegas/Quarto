// src/routes/AppRoutes.jsx
import { Routes, Route } from 'react-router-dom';
import { Calculator, AdminScreen, UserScreen, BookingTemplatePreview, PaymentSuccessScreen, PaymentScreenStandalone} from '../Screen/index';
import { UserLogin } from '../Components';

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Calculator />} />
    <Route path="/admin" element={<AdminScreen />} />
    <Route path="/login" element={<UserLogin />} />
    <Route path="/user" element={<UserScreen />} />
    <Route path="/payment" element={<PaymentScreenStandalone />} />
    <Route path="/payment-success" element={<PaymentSuccessScreen />} />
    <Route path="/booking-preview" element={<BookingTemplatePreview />} />


  </Routes>
);

export default AppRoutes;