; Inno Setup script - VRChat Legends Group Tool
; Full install wizard: choose location (default %%appdata%%), desktop shortcut, then install and launch.

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
; Show destination folder (default %%appdata%%\VRChat Legends Group Tool)
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog
OutputDir=installer_output
OutputBaseFilename=VRChat-Legends-Group-Tool-Setup
SetupIconFile=app_icon.ico
UninstallDisplayIcon={app}\{#MyAppExe}
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
WizardSizePercent=120,100
WizardResizable=yes

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[CustomMessages]
english.LaunchApp=Launch {#MyAppName} when setup finishes

[Tasks]
Name: "desktopicon"; Description: "Create a &desktop shortcut"; GroupDescription: "Additional shortcuts:"; Flags: checkedonce
Name: "launchapp"; Description: "{cm:LaunchApp}"; GroupDescription: "Finish:"; Flags: checkedonce

[Dirs]
Name: "{app}\data"; Flags: uninsalwaysuninstall
Name: "{app}\frontend"; Flags: uninsalwaysuninstall

[Files]
Source: "dist\{#MyAppExe}"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExe}"
Name: "{group}\Uninstall {#MyAppName}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExe}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExe}"; Description: "{cm:LaunchApp}"; Flags: nowait postinstall; Tasks: launchapp

[UninstallDelete]
Type: dirifempty; Name: "{app}"
