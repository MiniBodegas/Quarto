const InventoryPhoto = ({ selectedItems = [], onContinue, onBack, handlePhotoChange, photos = {} }) => (
  <div className="container mx-auto max-w-2xl p-4">
    <h2 className="text-xl font-bold mb-6 text-[#012E58]">Sube fotos de tus artículos</h2>
    <div className="flex flex-wrap gap-6 justify-center">
      {selectedItems.map(item => (
        <div
          key={item.id}
          className="bg-white rounded-xl p-4 shadow flex flex-col items-center justify-center"
          style={{ width: '220px', height: '220px', aspectRatio: '1/1' }}
        >
          <div className="font-bold mb-2 text-[#012E58] text-center">{item.name}</div>
          <label className="cursor-pointer bg-[#012E58] text-white px-4 py-2 rounded-lg shadow hover:bg-[#014A8F] transition-all duration-200 mb-2">
            Subir foto
            <input
              type="file"
              accept="image/*"
              onChange={e => handlePhotoChange(item.id, e.target.files[0])}
              className="hidden"
            />
          </label>
          {photos[item.id] && (
            <div className="mt-2">
              <img
                src={photos[item.id]}
                alt={item.name}
                className="h-24 w-24 object-cover rounded"
                style={{ aspectRatio: '1/1' }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
    <div className="flex justify-end space-x-4 mt-8">
      <button
        onClick={onBack}
        className="bg-gray-200 text-[#012E58] font-bold px-6 py-2 rounded-xl shadow hover:bg-gray-300 transition-all duration-200"
      >
        Volver
      </button>
      <button
        onClick={onContinue}
        className="bg-[#012E58] text-white font-bold px-6 py-2 rounded-xl shadow-lg hover:bg-[#014A8F] hover:scale-105 transition-all duration-200"
      >
        Continuar
      </button>
    </div>
  </div>
);

export default InventoryPhoto;