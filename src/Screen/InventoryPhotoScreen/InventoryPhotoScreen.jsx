import { useState } from "react";
import { InventoryPhoto } from "../../Components";

const InventoryPhotoScreen = ({ selectedItems = [], onContinue, onBack }) => {
    const [photos, setPhotos] = useState({});

    // Convierte el archivo a base64
    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    // Handler para subir la foto y guardar en estado
    const handlePhotoChange = async (itemId, file) => {
        const base64 = await fileToBase64(file);
        setPhotos(prev => ({ ...prev, [itemId]: base64 }));
    };

    // Al continuar, guarda las fotos en localStorage y avanza
    const handleContinue = () => {
        localStorage.setItem('quarto_inventory_photos', JSON.stringify(photos));
        onContinue(photos);
    };

    return (
        <InventoryPhoto
            selectedItems={selectedItems}
            onContinue={handleContinue}
            onBack={onBack}
            handlePhotoChange={handlePhotoChange}
            photos={photos}
        />
    );
};

export default InventoryPhotoScreen;