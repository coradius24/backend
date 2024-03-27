function mapFontAwesomeClassNameToIconName(className) {
    const parts = className.split(' '); 
    const iconNameParts = parts[1]
    .split('-')
    .map((part) => {
      return part.charAt(0).toUpperCase() + part.slice(1);
    });
    return iconNameParts.join('');
  }
export default mapFontAwesomeClassNameToIconName;