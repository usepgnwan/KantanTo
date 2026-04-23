import React, { useState, useEffect } from 'react';
import { Menu, Button, Space, Drawer } from 'antd';
import { MenuOutlined, SunOutlined, MoonOutlined } from '@ant-design/icons';
import { useTheme } from '../../context/ThemeContext';
import { Link, useLocation } from 'react-router-dom';
import { menuConfig } from '../../routes/config';

const Navbar: React.FC = () => {
  const { mode, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileVisible, setMobileVisible] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const menuItems = menuConfig.filter(item => !item.hidden).map(item => {
    if (item.path.startsWith('/#')) {
      return {
        key: item.path,
        label: (
          <a 
            href={item.path} 
            onClick={(e) => {
              e.preventDefault();
              const id = item.path.split('#')[1];
              const el = document.getElementById(id);
              if (el) el.scrollIntoView({ behavior: 'smooth' });
              setMobileVisible(false);
            }}
          >
            {item.name}
          </a>
        )
      };
    }
    return {
      key: item.path,
      label: <Link to={item.path}>{item.name}</Link>,
    };
  });

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'glass py-2 shadow-sm' : 'bg-transparent py-4'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="text-2xl font-bold tracking-tight text-primary font-manrope">
            SNBT<span className="text-surface-on">Tryout</span>
          </Link>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-8">
          <Menu
            mode="horizontal"
            selectedKeys={[location.pathname]}
            items={menuItems}
            className="bg-transparent border-none flex-grow min-w-[300px]"
          />
          <Space size="middle">
            <Button 
              type="text" 
              icon={mode === 'dark' ? <SunOutlined /> : <MoonOutlined />} 
              onClick={toggleTheme}
              className="text-lg"
            />
            <Button type="primary" className="rounded-full px-6">Get Started</Button>
          </Space>
        </div>

        {/* Mobile Toggle */}
        <div className="md:hidden flex items-center space-x-4">
          <Button 
            type="text" 
            icon={mode === 'dark' ? <SunOutlined /> : <MoonOutlined />} 
            onClick={toggleTheme}
          />
          <Button icon={<MenuOutlined />} onClick={() => setMobileVisible(true)} />
        </div>
      </div>

      <Drawer
        title="Menu"
        placement="right"
        onClose={() => setMobileVisible(false)}
        open={mobileVisible}
      >
        <Menu
          mode="vertical"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={() => setMobileVisible(false)}
          className="border-none"
        />
        <div className="mt-8">
          <Button type="primary" block className="rounded-full">Get Started</Button>
        </div>
      </Drawer>
    </nav>
  );
};

export default Navbar;
