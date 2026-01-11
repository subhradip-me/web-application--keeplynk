import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import api from '../../shared/api/apiClient';
import { useAuth } from '../../../../context/AuthContext';
import {
    toggleSidebar,
    setCurrentPersona,
    setActiveItem,

    togglePersonaDropdown,
    closePersonaDropdown
} from '@/store/sidebarSlice';
import {
    GraduationCap,
    Briefcase,
    BookOpen,
    FileStack,
    Camera,
    Rocket,
    FlaskConical,
    Home,
    BookMarked,
    Folder,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Settings,
    LogOut,
    Plus,
    Search,
    Command,
    X
} from 'lucide-react';
import logo from '../../../../assets/logo1.svg';

export default function Sidebar({ isMobileMenuOpen, setIsMobileMenuOpen }) {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = React.useState('');
    const [showTooltip, setShowTooltip] = React.useState(null);

    //Profile data from Auth Context
    const { user: authUser, logout } = useAuth();

    // Sync Redux user with AuthContext user
    React.useEffect(() => {
        if (authUser && (authUser.firstName || authUser.name)) {
            dispatch({ type: 'sidebar/setUser', payload: {
                name: authUser.firstName ? `${authUser.firstName} ${authUser.lastName || ''}`.trim() : authUser.name,
                email: authUser.email
            }});
        }
    }, [authUser, dispatch]);
    const fetchUserProfile = async () => {
        try {
            const response = await api.get('/auth/me');
            return response.data;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            return null;
        }
    };

    // Get state from Redux
    const isCollapsed = useAppSelector((state) => state.sidebar.isCollapsed);
    const currentPersona = useAppSelector((state) => state.sidebar.currentPersona);
    const activeItem = useAppSelector((state) => state.sidebar.activeItem);
    const showPersonaDropdown = useAppSelector((state) => state.sidebar.showPersonaDropdown);
    const user = useAppSelector((state) => state.sidebar.user);
    const userPersonas = useAppSelector((state) => state.sidebar.userPersonas);

    // Memoize persona configurations to prevent recreation
    const personaConfigs = useMemo(() => ({
        genaral: {
            title: "General Hub",
            subtitle: "Personal Organization",
            icon: Home,
            menuItems: [
                { title: "Home", icon: Home, href: "/genaral/home" },
                { title: "Resources", icon: FileStack, href: "/genaral/resources" },
                { title: "Folders", icon: Folder, href: "/genaral/folders" },
                { title: "Study Sets", icon: BookOpen, href: "/genaral/study-sets" },
            ]
        },
        student: {
            title: "Student Hub",
            subtitle: "Learning & Study",
            icon: GraduationCap,
            menuItems: [
                { title: "Home", icon: Home, href: "/student/home" },
                { title: "Resources", icon: FileStack, href: "/student/resources" },
                { title: "Folders", icon: Folder, href: "/student/folders" },
                { title: "Study Sets", icon: BookOpen, href: "/student/study-sets" },
            ]
        },
        professional: {
            title: "Professional Hub",
            subtitle: "Work & Projects",
            icon: Briefcase,
            menuItems: [
                { title: "Dashboard", icon: Home, href: "/professional/dashboard" },
                { title: "Bookmarks", icon: BookMarked, href: "/professional/bookmarks" },
                { title: "Projects", icon: Folder, href: "/professional/projects" },
            ]
        },
        creator: {
            title: "Creator Hub",
            subtitle: "Content Creation",
            icon: Camera,
            menuItems: [
                { title: "Home", icon: Home, href: "/creator" },
                { title: "Content", icon: Folder, href: "/creator/content" },
            ]
        },
        entrepreneur: {
            title: "Entrepreneur Hub",
            subtitle: "Business & Innovation",
            icon: Rocket,
            menuItems: [
                { title: "Dashboard", icon: Home, href: "/entrepreneur/dashboard" },
                { title: "Plans", icon: Folder, href: "/entrepreneur/plans" },
            ]
        },
        researcher: {
            title: "Research Hub",
            subtitle: "Academic & Scientific",
            icon: FlaskConical,
            menuItems: [
                { title: "Home", icon: Home, href: "/researcher" },
                { title: "Papers", icon: Folder, href: "/researcher/papers" },
            ]
        }
    }), []); // Memoize persona configs

    const config = personaConfigs[currentPersona] || personaConfigs.genaral;
    const PersonaIcon = config.icon;

    // Memoize persona options to prevent recreation
    const personaOptions = useMemo(() => {
        return userPersonas.map(persona => {
            const config = personaConfigs[persona.personaType] || personaConfigs.genaral;
            return {
                key: persona.personaType,
                label: persona.customName || config.title.replace(' Hub', ''),
                subtitle: config.subtitle,
                icon: config.icon
            };
        });
    }, [userPersonas, personaConfigs]);

    // Find the current persona from user's personas for display
    const currentUserPersona = userPersonas.find(p => p.personaType === currentPersona);
    const currentPersonaDisplayName = currentUserPersona?.customName || config.title.replace(' Hub', '');

    // Memoize callback functions to prevent unnecessary re-renders
    const handleToggleSidebar = useCallback(() => {
        dispatch(toggleSidebar());
    }, [dispatch]);

    const handlePersonaChange = useCallback((newPersona) => {
        dispatch(setCurrentPersona(newPersona));
        dispatch(closePersonaDropdown());
        // Optionally navigate to persona home
        if (personaConfigs[newPersona]?.menuItems?.[0]?.href) {
            navigate(personaConfigs[newPersona].menuItems[0].href);
        }
    }, [dispatch, navigate, personaConfigs]);

    const handleAddPersona = useCallback(() => {
        dispatch(closePersonaDropdown());
        navigate('/add-persona');
    }, [dispatch, navigate]);

    const handleLogout = useCallback(() => {
        logout();
        navigate('/signin');
    }, [logout, navigate]);

    const handleMenuItemClick = useCallback((item) => {
        dispatch(setActiveItem(item.title));
        if (item.href) {
            navigate(item.href);
            if (setIsMobileMenuOpen) {
                setIsMobileMenuOpen(false); // Close mobile menu after navigation
            }
        }
    }, [dispatch, navigate, setIsMobileMenuOpen]);

    const renderMenuItem = useCallback((item) => {
        const Icon = item.icon;
        const isActive = activeItem === item.title;

        return (
            <button
                key={item.title}
                className={`relative w-full flex items-center rounded-md text-left transition-all group ${isActive
                        ? 'bg-zinc-200/80 text-zinc-900 shadow-xs'
                        : 'text-zinc-600 hover:bg-zinc-100/80 hover:text-zinc-900'
                    } ${isCollapsed ? 'justify-center px-2 py-2' : 'gap-3 px-3 py-2'}`}
                onClick={() => handleMenuItemClick(item)}
                onMouseEnter={() => isCollapsed && setShowTooltip(item.title)}
                onMouseLeave={() => setShowTooltip(null)}
                title={isCollapsed ? item.title : ''}
            >
                <Icon className="h-4.5 w-4.5 flex-shrink-0" />
                {!isCollapsed && (
                    <>
                        <span className="truncate text-sm font-medium flex-1">{item.title}</span>
                        {item.shortcut && (
                            <span className="text-[10px] text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">{item.shortcut}</span>
                        )}
                    </>
                )}
                {isCollapsed && showTooltip === item.title && (
                    <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-zinc-300 text-zinc-50 text-sm rounded whitespace-nowrap z-50 shadow-lg">
                        {item.title}
                    </div>
                )}
            </button>
        );
    }, [activeItem, isCollapsed, handleMenuItemClick, showTooltip]);

    return (
        <>
            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-zinc-900/50 z-40 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div
                className={`fixed md:relative inset-y-0 left-0 z-50 flex h-screen flex-col bg-zinc-50 border-r border-zinc-200/60 transition-all duration-300 ease-in-out overflow-x-hidden ${isCollapsed ? 'md:w-16' : 'md:w-64'
                    } ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                    } w-64`}
            >
                {/* Header */}
                <div className="flex h-14 items-center justify-between px-4 py-2.5 border-b border-zinc-200/40">
                    {!isCollapsed ? (
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 items-center justify-center rounded">
                                <img src={logo} alt="KeepLynk Logo" className="h-full w-full object-contain" />
                            </div>
                            <span className="text-sm font-semibold text-zinc-900 tracking-tight">KeepLynk</span>
                        </div>
                    ) : (
                        <div className="flex h-7 w-7 items-center justify-center rounded mx-auto">
                            <img src={logo} alt="KeepLynk Logo" className="h-full w-full object-contain" />
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        {/* Close button for mobile */}
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="md:hidden h-6 w-6 flex items-center justify-center rounded hover:bg-zinc-200/60 transition-colors"
                            title="Close menu"
                        >
                            <X className="h-4 w-4 text-zinc-500" />
                        </button>
                        {/* Collapse button for desktop */}
                        {!isCollapsed && (
                            <button
                                onClick={handleToggleSidebar}
                                className="hidden md:flex h-6 w-6 items-center justify-center rounded hover:bg-zinc-200/60 transition-colors"
                                title="Collapse sidebar"
                            >
                                <ChevronLeft className="h-4 w-4 text-zinc-500" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Expand button when collapsed - desktop only */}
                {isCollapsed && (
                    <div className="hidden md:block px-2 py-2">
                        <button
                            onClick={handleToggleSidebar}
                            className="w-full h-8 flex items-center justify-center rounded hover:bg-zinc-200/60 transition-colors"
                            title="Expand sidebar"
                        >
                            <ChevronRight className="h-4 w-4 text-zinc-500" />
                        </button>
                    </div>
                )}

                {/* Search Bar */}
                {!isCollapsed && (
                    <div className="px-3 pt-2.5 pb-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-8 pr-8 py-2 text-sm bg-white border border-zinc-200/60 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:border-zinc-900 transition-all placeholder:text-zinc-400"
                            />
                            {searchQuery ? (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                                >
                                    <span className="text-sm">✕</span>
                                </button>
                            ) : (
                                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-50">
                                    <Command className="h-3 w-3 text-zinc-400" />
                                    <span className="text-[10px] text-zinc-400">K</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Persona Selector */}
                {!isCollapsed && (
                    <div className="px-3 pb-2.5 relative">
                        <button
                            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-zinc-100/80 transition-colors group border border-transparent hover:border-zinc-200/60"
                            onClick={() => dispatch(togglePersonaDropdown())}
                        >
                            <div className="flex h-6 w-6 items-center justify-center rounded bg-zinc-900">
                                <PersonaIcon className="h-3.5 w-3.5 text-zinc-50" />
                            </div>
                            <div className="flex flex-col items-start flex-1 min-w-0">
                                <span className="text-sm font-medium text-zinc-900 truncate">{currentPersonaDisplayName}</span>
                                <span className="text-xs text-zinc-500 truncate leading-tight">{config.subtitle}</span>
                            </div>
                            <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${showPersonaDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {showPersonaDropdown && (
                            <div className="absolute top-full left-3 right-3 mt-1 bg-white border border-zinc-200/60 rounded-md shadow-sm z-50 overflow-hidden py-1.5">
                                {personaOptions.length ? (
                                    <>
                                        {personaOptions.map((option) => {
                                            const OptionIcon = option.icon;
                                            const isSelected = option.key === currentPersona;

                                            return (
                                                <button
                                                    key={option.key}
                                                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-left hover:bg-zinc-100/80 transition-colors ${isSelected ? 'bg-zinc-100/50' : ''
                                                        }`}
                                                    onClick={() => handlePersonaChange(option.key)}
                                                >
                                                    <div className="flex h-6 w-6 items-center justify-center rounded bg-zinc-900">
                                                        <OptionIcon className="h-3.5 w-3.5 text-zinc-50" />
                                                    </div>
                                                    <div className="flex flex-col items-start flex-1 min-w-0">
                                                        <span className="text-sm font-medium text-zinc-900 truncate">{option.label}</span>
                                                        <span className="text-xs text-zinc-500 truncate leading-tight">{option.subtitle}</span>
                                                    </div>
                                                    {isSelected && (
                                                        <div className="h-2 w-2 rounded-full bg-zinc-900" />
                                                    )}
                                                </button>
                                            );
                                        })}

                                        <div className="border-t border-zinc-200/60 my-1.5"></div>
                                    </>
                                ) : (
                                    <div className="px-2.5 py-3 text-center text-sm text-zinc-500">
                                        No personas added yet
                                    </div>
                                )}

                                {/* Add Persona Option */}
                                <button
                                    className="w-full flex items-center gap-2.5 px-2.5 py-2 text-left hover:bg-zinc-100/80 transition-colors"
                                    onClick={handleAddPersona}
                                >
                                    <div className="flex h-6 w-6 items-center justify-center rounded bg-zinc-200/80">
                                        <Plus className="h-3.5 w-3.5 text-zinc-600" />
                                    </div>
                                    <div className="flex flex-col items-start flex-1 min-w-0">
                                        <span className="text-sm font-medium text-zinc-900">Add Persona</span>
                                        <span className="text-xs text-zinc-500 leading-tight">Create new profile</span>
                                    </div>
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-2.5">
                    {!isCollapsed && (
                        <div className="px-2 pb-2">
                            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Workspace</span>
                        </div>
                    )}
                    <div className="space-y-0.5">
                        {config.menuItems
                            .filter(item => !searchQuery || item.title.toLowerCase().includes(searchQuery.toLowerCase()))
                            .map(item => renderMenuItem(item))}
                    </div>
                    {searchQuery && !config.menuItems.some(item => item.title.toLowerCase().includes(searchQuery.toLowerCase())) && (
                        <div className="px-2 py-8 text-center">
                            <p className="text-sm text-zinc-500">No results found</p>
                        </div>
                    )}
                </div>

                {/* Settings */}
                <div className="px-3 py-2.5 border-t border-zinc-200/40">
                    {!isCollapsed && (
                        <div className="px-2 pb-2">
                            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Account</span>
                        </div>
                    )}
                    <button
                        className={`relative w-full flex items-center gap-3 rounded-md text-left transition-all text-zinc-600 hover:bg-zinc-100/80 hover:text-zinc-900 group ${isCollapsed ? 'justify-center px-2 py-2' : 'px-3 py-2'
                            }`}
                        onClick={() => navigate('/settings')}
                        onMouseEnter={() => isCollapsed && setShowTooltip('Settings')}
                        onMouseLeave={() => setShowTooltip(null)}
                        title={isCollapsed ? 'Settings' : ''}
                    >
                        <Settings className="h-4.5 w-4.5 flex-shrink-0" />
                        {!isCollapsed && (
                            <>
                                <span className="truncate text-sm font-medium flex-1">Settings</span>
                                <span className="text-[10px] text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">⌘,</span>
                            </>
                        )}
                        {isCollapsed && showTooltip === 'Settings' && (
                            <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-zinc-900 text-zinc-50 text-sm rounded whitespace-nowrap z-50 shadow-lg">
                                Settings
                            </div>
                        )}
                    </button>
                </div>

                {/* User Profile */}
                <div className="border-t border-zinc-200/40 px-3 py-2.5">
                    {!isCollapsed ? (
                        <div className="relative flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-zinc-100/80 transition-colors cursor-pointer group">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-zinc-900 to-zinc-700 flex items-center justify-center ring-1 ring-zinc-200/60 shadow-sm">
                                <span className="text-xs font-bold text-zinc-50">
                                    {authUser?.firstName ? authUser.firstName.charAt(0).toUpperCase() : 'U'}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-zinc-900 truncate">{authUser?.firstName ? `${authUser.firstName} ${authUser.lastName || ''}`.trim() : 'User'}</p>
                                <p className="text-xs text-zinc-500 truncate leading-tight">{authUser?.email || 'user@example.com'}</p>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleLogout();
                                }}
                                className="h-7 w-7 flex items-center justify-center rounded hover:bg-zinc-200/60 transition-all opacity-0 group-hover:opacity-100"
                                title="Logout (⇧⌘Q)"
                            >
                                <LogOut className="h-4 w-4 text-zinc-500" />
                            </button>
                        </div>
                    ) : (
                        <div 
                            className="relative h-8 w-8 rounded-full bg-gradient-to-br from-zinc-900 to-zinc-700 flex items-center justify-center ring-1 ring-zinc-200/60 shadow-sm cursor-pointer mx-auto"
                            onMouseEnter={() => setShowTooltip('Profile')}
                            onMouseLeave={() => setShowTooltip(null)}
                            title={authUser?.firstName ? `${authUser.firstName} ${authUser.lastName || ''}`.trim() : 'User'}
                        >
                            <span className="text-xs font-bold text-zinc-50">
                                {authUser?.firstName ? authUser.firstName.charAt(0).toUpperCase() : 'U'}
                            </span>
                            {showTooltip === 'Profile' && (
                                <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-zinc-900 text-zinc-50 text-sm rounded whitespace-nowrap z-50 shadow-lg">
                                    {authUser?.firstName ? `${authUser.firstName} ${authUser.lastName || ''}`.trim() : 'User'}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
