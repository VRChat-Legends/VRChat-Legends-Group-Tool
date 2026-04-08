; Inno Setup script - VRChat Legends Group Tool
; Full install wizard: choose location (default %appdata%), desktop shortcut, then install and launch.

#define MyAppName "VRChat Legends Group Tool"
#define MyAppExe "VRChat Legends Group Tool.exe"
#define MyAppPublisher "EcIipse Studios"

[Setup]
AppId={{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}
AppName={#MyAppName}
AppVersion=2.0
AppPublisher={#MyAppPublisher}
DefaultDirName={userappdata}\{#MyAppName}
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
DisableDirPage=no
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog
OutputDir=installer_output
OutputBaseFilename=VRChat-Legends-Group-Tool-Setup
SetupIconFile=assets\branding\group_tool_icon.ico
UninstallDisplayIcon={app}\{#MyAppExe}
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
WizardSizePercent=120,100
WizardResizable=yes
; Close the app before install/uninstall
CloseApplications=yes
CloseApplicationsFilter=*.exe

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[CustomMessages]
english.LaunchApp=Launch {#MyAppName} when setup finishes

[Tasks]
Name: "desktopicon"; Description: "Create a &desktop shortcut"; GroupDescription: "Additional shortcuts:"; Flags: checkedonce
Name: "launchapp"; Description: "{cm:LaunchApp}"; GroupDescription: "Finish:"; Flags: checkedonce

[Dirs]
Name: "{app}\data"; Flags: uninsalwaysuninstall

[Files]
Source: "dist\{#MyAppExe}"; DestDir: "{app}"; Flags: ignoreversion
Source: "dist\frontend\*"; DestDir: "{app}\frontend"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "assets\*"; DestDir: "{app}\assets"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExe}"
Name: "{group}\Uninstall {#MyAppName}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExe}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExe}"; Description: "{cm:LaunchApp}"; Flags: nowait postinstall; Tasks: launchapp

[UninstallRun]
; Kill the app process before uninstall to avoid locked-file errors
Filename: "taskkill"; Parameters: "/F /IM ""{#MyAppExe}"""; Flags: runhidden; RunOnceId: "KillApp"

[UninstallDelete]
Type: filesandordirs; Name: "{app}\data"
Type: filesandordirs; Name: "{app}\frontend"
Type: filesandordirs; Name: "{app}\assets"
Type: filesandordirs; Name: "{app}\__pycache__"
Type: files; Name: "{app}\*.log"
Type: files; Name: "{app}\*.json"
Type: files; Name: "{app}\*.db"
Type: dirifempty; Name: "{app}"
