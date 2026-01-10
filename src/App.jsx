import React from "react";
import { Routes, Route } from "react-router-dom";
import ShareHandler from './pwa/ShareHandler'


import DesktopLayout from "./desktop/modules/core/components/DesktopLayout";

import Signin from "./desktop/modules/auth/pages/Signin";
import Signup from "./desktop/modules/auth/pages/Signup";
//desktop persona pages
import Home from "./desktop/modules/personas/student/pages/Home";
import Folders from "./desktop/modules/personas/student/pages/Folders";
import FolderDetail from "./desktop/modules/personas/student/pages/FolderDetail";
import Resources from "./desktop/modules/personas/student/pages/Resources";
import StudySets from "./desktop/modules/personas/student/pages/StudySets";

//mobile screen detection
import MobileLayout from "./mobile/modules/core/components/MobileLayout";
import MobileHome from "./mobile/modules/personas/student/pages/Home";
import MobileFolders from "./mobile/modules/personas/student/pages/Folders";
import MobileFolder from "./mobile/modules/personas/student/pages/Folder";
import MobileResources from "./mobile/modules/personas/student/pages/Resources";

function useScreen() {
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 1024);

  React.useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return isMobile;
}

export default function App() {
  const isMobile = useScreen();

  // � Mobile Routes
  if (isMobile) {
    return (
      <Routes>
        <Route path="/signin" element={<Signin />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/share" element={<ShareHandler />} />
        
        <Route element={<MobileLayout />}>
          <Route path="/" element={<MobileHome />} />
          <Route path="/student/home" element={<MobileHome />} />
          <Route path="/student/folders" element={<MobileFolders />} />
          <Route path="/student/folders/:folderId" element={<MobileFolder />} />
          <Route path="/student/resources" element={<MobileResources />} />
        </Route>
      </Routes>
    );
  }

  return (
    <Routes>
      {/* 🔓 Public Routes (NO layout) */}
      <Route path="/signin" element={<Signin />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/share" element={<ShareHandler />} />

      {/* 🖥️ Desktop App Routes (WITH layout) */}
      <Route element={<DesktopLayout />}>
        <Route
          path="/"
          element={
            <div className="p-8">
              <h1 className="text-3xl font-bold text-zinc-900 mb-4">
                Welcome to KeepLynk
              </h1>
              <p className="text-zinc-600">
                Select a persona from the sidebar to get started.
              </p>
            </div>
          }
        />

        <Route path="/student/home" element={<Home />} />
        <Route path="/student/resources" element={<Resources />} />
        <Route path="/student/folders" element={<Folders />} />
        <Route path="/student/folders/:folderId" element={<FolderDetail />} />
        <Route path="/student/study-sets" element={<StudySets />} />
      </Route>
    </Routes>
  );
}
