function Header({ logoUrl = '/LogoAzul.png', alt = 'Quarto' }) {
  return (
    <header className="w-full px-4 py-3 flex items-center justify-center">
      <img
        src={logoUrl}
        alt={alt}
        className="h-14 w-auto"
      />
    </header>
  );
}

export default Header;