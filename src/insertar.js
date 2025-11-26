import { createClient } from '@supabase/supabase-js';


// Convierte los ítems para Supabase (solo datos serializables)
const PREDEFINED_ITEMS_DATA = [
    // Dormitorio
    { id: '14', name: 'Armario', width: 0.6, height: 1.9, depth: 0.55, categoryId: 'dormitorio' },
    { id: '4', name: 'Cama king', width: 2.0, height: 0.5, depth: 2.0, categoryId: 'dormitorio' },
    { id: '3', name: 'Cama queen', width: 2.0, height: 0.5, depth: 1.6, categoryId: 'dormitorio' },
    { id: '2', name: 'Cama semidoble', width: 1.9, height: 0.5, depth: 1.2, categoryId: 'dormitorio' },
    { id: '1', name: 'Cama sencilla', width: 1.9, height: 0.5, depth: 1.0, categoryId: 'dormitorio' },
    { id: '8', name: 'Colchón king', width: 2.0, height: 0.3, depth: 2.0, categoryId: 'dormitorio' },
    { id: '7', name: 'Colchón queen', width: 2.0, height: 0.3, depth: 1.6, categoryId: 'dormitorio' },
    { id: '6', name: 'Colchón semidoble', width: 1.9, height: 0.3, depth: 1.2, categoryId: 'dormitorio' },
    { id: '5', name: 'Colchón sencillo', width: 1.9, height: 0.3, depth: 0.9, categoryId: 'dormitorio' },
    { id: '10', name: 'Cómoda 3 cajones', width: 1.2, height: 0.8, depth: 0.5, categoryId: 'dormitorio' },
    { id: '11', name: 'Cómoda 6 cajones', width: 1.5, height: 0.8, depth: 0.5, categoryId: 'dormitorio' },
    { id: '13', name: 'Espejo - largo completo', width: 0.5, height: 1.8, depth: 0.1, categoryId: 'dormitorio' },
    { id: '15', name: 'Lámpara de mesa', width: 0.25, height: 0.5, depth: 0.25, categoryId: 'dormitorio' },
    { id: '9', name: 'Mesa de noche', width: 0.5, height: 0.6, depth: 0.4, categoryId: 'dormitorio' },
    { id: '12', name: 'Tocador', width: 1.2, height: 0.75, depth: 0.5, categoryId: 'dormitorio' },

    // Sala de Estar
    { id: '23', name: 'Alfombra (enrollada) - grande', width: 3.0, height: 0.35, depth: 0.35, categoryId: 'sala' },
    { id: '24', name: 'Alfombra (enrollada) - mediana', width: 2.0, height: 0.25, depth: 0.25, categoryId: 'sala' },
    { id: '31', name: 'Cuadro', width: 0.6, height: 0.8, depth: 0.1, categoryId: 'sala' },
    { id: '17', name: 'Librería o biblioteca', width: 1.0, height: 2.0, depth: 0.3, categoryId: 'sala' },
    { id: '33', name: 'Mecedora', width: 0.6, height: 1.0, depth: 0.8, categoryId: 'sala' },
    { id: '25', name: 'Mesa auxiliar', width: 0.5, height: 0.5, depth: 0.5, categoryId: 'sala' },
    { id: '18', name: 'Mesa de centro', width: 0.9, height: 0.45, depth: 0.9, categoryId: 'sala' },
    { id: '30', name: 'Mueble para tv', width: 1.5, height: 0.6, depth: 0.5, categoryId: 'sala' },
    { id: '29', name: 'Poltrona - silla', width: 0.8, height: 1.0, depth: 0.9, categoryId: 'sala' },
    { id: '32', name: 'Silla reclinable', width: 0.8, height: 1.0, depth: 0.9, categoryId: 'sala' },
    { id: '16', name: 'Sillón', width: 1.0, height: 1.0, depth: 0.9, categoryId: 'sala' },
    { id: '26', name: 'Sofá - 2 puestos', width: 1.5, height: 0.9, depth: 0.9, categoryId: 'sala' },
    { id: '27', name: 'Sofá - 3 puestos', width: 2.0, height: 0.9, depth: 0.9, categoryId: 'sala' },
    { id: '28', name: 'Sofá en forma de l', width: 2.5, height: 0.9, depth: 1.5, categoryId: 'sala' },
    { id: '20', name: 'Televisor 32"', width: 0.8, height: 0.5, depth: 0.2, categoryId: 'sala' },
    { id: '21', name: 'Televisor 48"', width: 1.2, height: 0.7, depth: 0.2, categoryId: 'sala' },
    { id: '22', name: 'Televisor 75"', width: 1.7, height: 1.0, depth: 0.25, categoryId: 'sala' },
    { id: '19', name: 'Vitrina', width: 1.0, height: 1.8, depth: 0.4, categoryId: 'sala' },

    // Comedor y Cocina
    { id: '40', name: 'Banca de comedor', width: 1.8, height: 0.45, depth: 0.45, categoryId: 'comedor_cocina' },
    { id: '35', name: 'Bife o aparador', width: 1.8, height: 0.9, depth: 0.5, categoryId: 'comedor_cocina' },
    { id: '52', name: 'Cafetera', width: 0.3, height: 0.4, depth: 0.2, categoryId: 'comedor_cocina' },
    { id: '55', name: 'Freidora de aire', width: 0.3, height: 0.35, depth: 0.3, categoryId: 'comedor_cocina' },
    { id: '48', name: 'Horno pequeño', width: 0.6, height: 0.6, depth: 0.6, categoryId: 'comedor_cocina' },
    { id: '44', name: 'Lavadora', width: 0.6, height: 0.85, depth: 0.6, categoryId: 'comedor_cocina' },
    { id: '43', name: 'Lavadora de platos', width: 0.6, height: 0.85, depth: 0.6, categoryId: 'comedor_cocina' },
    { id: '46', name: 'Lavadora-secadora de torre', width: 0.6, height: 1.8, depth: 0.6, categoryId: 'comedor_cocina' },
    { id: '51', name: 'Licuadora', width: 0.2, height: 0.4, depth: 0.2, categoryId: 'comedor_cocina' },
    { id: '37', name: 'Mesa de comedor - 4 puestos', width: 1.2, height: 0.75, depth: 0.8, categoryId: 'comedor_cocina' },
    { id: '38', name: 'Mesa de comedor - 6 puestos', width: 1.8, height: 0.75, depth: 0.9, categoryId: 'comedor_cocina' },
    { id: '39', name: 'Mesa de comedor - 8 puestos', width: 2.4, height: 0.75, depth: 1.0, categoryId: 'comedor_cocina' },
    { id: '47', name: 'Microondas', width: 0.5, height: 0.3, depth: 0.4, categoryId: 'comedor_cocina' },
    { id: '54', name: 'Mini bar', width: 0.5, height: 0.7, depth: 0.5, categoryId: 'comedor_cocina' },
    { id: '50', name: 'Nevecon', width: 0.9, height: 1.8, depth: 0.7, categoryId: 'comedor_cocina' },
    { id: '49', name: 'Nevera', width: 0.7, height: 1.7, depth: 0.7, categoryId: 'comedor_cocina' },
    { id: '45', name: 'Secadora', width: 0.6, height: 0.85, depth: 0.6, categoryId: 'comedor_cocina' },
    { id: '34', name: 'Silla de bar', width: 0.4, height: 1.1, depth: 0.4, categoryId: 'comedor_cocina' },
    { id: '36', name: 'Silla de comedor', width: 0.45, height: 0.9, depth: 0.45, categoryId: 'comedor_cocina' },
    { id: '41', name: 'Taburete', width: 0.3, height: 0.45, depth: 0.3, categoryId: 'comedor_cocina' },
    { id: '53', name: 'Ventilador', width: 0.4, height: 1.3, depth: 0.4, categoryId: 'comedor_cocina' },

    // Oficina
    { id: '59', name: 'Archivador', width: 0.45, height: 0.75, depth: 0.6, categoryId: 'oficina' },
    { id: '60', name: 'Computador de escritorio', width: 0.5, height: 0.45, depth: 0.2, categoryId: 'oficina' },
    { id: '56', name: 'Escritorio', width: 1.2, height: 0.75, depth: 0.6, categoryId: 'oficina' },
    { id: '57', name: 'Escritorio en l', width: 1.5, height: 0.75, depth: 1.5, categoryId: 'oficina' },
    { id: '62', name: 'Impresora', width: 0.5, height: 0.3, depth: 0.45, categoryId: 'oficina' },
    { id: '61', name: 'Monitor de escritorio', width: 0.5, height: 0.35, depth: 0.1, categoryId: 'oficina' },
    { id: '58', name: 'Silla de oficina', width: 0.65, height: 1.0, depth: 0.65, categoryId: 'oficina' },
    { id: '63', name: 'Tablero', width: 1.5, height: 0.03, depth: 1.0, categoryId: 'oficina' },

    // Varios
    { id: '42', name: 'Aire acondicionado', width: 0.5, height: 0.7, depth: 0.35, categoryId: 'varios' },
    { id: '69', name: 'Asador grande', width: 1.5, height: 1.2, depth: 0.6, categoryId: 'varios' },
    { id: '71', name: 'Asador mediano', width: 1.2, height: 1.0, depth: 0.5, categoryId: 'varios' },
    { id: '68', name: 'Barril mediano', width: 0.65, height: 0.9, depth: 0.65, categoryId: 'varios' },
    { id: '67', name: 'Barril pequeño', width: 0.5, height: 0.6, depth: 0.5, categoryId: 'varios' },
    { id: '72', name: 'Bicicleta', width: 1.8, height: 1.0, depth: 0.5, categoryId: 'varios' },
    { id: '73', name: 'Bicicleta de niño', width: 1.4, height: 0.8, depth: 0.4, categoryId: 'varios' },
    { id: '75', name: 'Bicicleta estática', width: 1.0, height: 1.2, depth: 0.5, categoryId: 'varios' },
    { id: '82', name: 'Caja grande', width: 0.6, height: 0.35, depth: 0.4, categoryId: 'varios' },
    { id: '81', name: 'Caja mediana', width: 0.4, height: 0.25, depth: 0.3, categoryId: 'varios' },
    { id: '80', name: 'Caja pequeña', width: 0.3, height: 0.2, depth: 0.2, categoryId: 'varios' },
    { id: '78', name: 'Caja quarto grande', width: 0.6, height: 0.4, depth: 0.4, categoryId: 'varios' },
    { id: '79', name: 'Caja quarto mediana', width: 0.6, height: 0.32, depth: 0.4, categoryId: 'varios' },
    { id: '87', name: 'Cama para mascotas', width: 0.6, height: 0.15, depth: 0.4, categoryId: 'varios' },
    { id: '76', name: 'Caminadora', width: 1.5, height: 1.4, depth: 0.75, categoryId: 'varios' },
    { id: '86', name: 'Coche de bebé', width: 1.0, height: 1.0, depth: 0.6, categoryId: 'varios' },
    { id: '83', name: 'Cuna', width: 1.3, height: 1.0, depth: 0.5, categoryId: 'varios' },
    { id: '74', name: 'Elíptica', width: 1.5, height: 1.5, depth: 0.6, categoryId: 'varios' },
    { id: '84', name: 'Maleta de mano (10 kg)', width: 0.55, height: 0.23, depth: 0.35, categoryId: 'varios' },
    { id: '85', name: 'Maleta grande (23 kg)', width: 0.75, height: 0.3, depth: 0.5, categoryId: 'varios' },
    { id: '70', name: 'Matera', width: 0.3, height: 0.4, depth: 0.3, categoryId: 'varios' },
    { id: '66', name: 'Mesa exterior', width: 1.5, height: 0.75, depth: 0.9, categoryId: 'varios' },
    { id: '64', name: 'Silla exterior', width: 0.5, height: 0.9, depth: 0.5, categoryId: 'varios' },
    { id: '65', name: 'Sofá de exterior', width: 1.8, height: 0.9, depth: 0.9, categoryId: 'varios' },
    { id: '77', name: 'Tabla de surf', width: 1.8, height: 0.1, depth: 0.5, categoryId: 'varios' },
];


// Configura tu cliente Supabase
const supabase = createClient('https://potowvactzxmbgqgsgyo.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvdG93dmFjdHp4bWJncWdzZ3lvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDAwNzAzMSwiZXhwIjoyMDc5NTgzMDMxfQ.LkQhHD8YohsbB_JTAaJ0il1QgNqN1DLRBrVDQLotTL0');

// Inserta ítems
const { data, error } = await supabase.from('items').insert(PREDEFINED_ITEMS_DATA);

if (error) {
    console.error('Error al insertar:', error);
} else {
    console.log('Datos insertados:', data);
}