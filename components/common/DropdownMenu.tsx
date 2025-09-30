import React, { useState, useRef, useEffect } from 'react';

interface DropdownMenuProps {
    buttonContent: React.ReactNode;
    children: React.ReactNode;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ buttonContent, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-full hover:bg-white/20 transition-colors duration-200">
                {buttonContent}
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 ring-1 ring-black ring-opacity-5">
                    <div className="py-1">
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DropdownMenu;