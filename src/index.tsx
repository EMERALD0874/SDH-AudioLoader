import {
  ButtonItem,
  definePlugin,
  PanelSection,
  PanelSectionRow,
  ServerAPI,
  staticClasses,
  DropdownItem,
  Router,
  beforePatch,
  Tabs,
  afterPatch,
  SliderField,
} from "decky-frontend-lib";
import { VFC, useMemo, useEffect, useState } from "react";
import { RiFolderMusicFill } from "react-icons/ri";
import { FaVolumeUp, FaMusic } from "react-icons/fa";
import { AudioParent } from "./gamepadAudioFinder";
import { PackBrowserPage, UninstallPage, AboutPage } from "./pack-manager";
import * as python from "./python";
import {
  GlobalState,
  GlobalStateContextProvider,
  useGlobalState,
} from "./state/GlobalState";

const Content: VFC<{ serverAPI: ServerAPI }> = ({}) => {
  const {
    activeSound,
    gamesRunning,
    setActiveSound,
    soundPacks,
    setSoundPacks,
    menuMusic,
    setMenuMusic,
    selectedMusic,
    setSelectedMusic,
    soundVolume,
    setSoundVolume,
    musicVolume,
    setMusicVolume,
    gainNode,
  } = useGlobalState();

  const [dummyFuncResult, setDummyResult] = useState<boolean>(false);

  function dummyFuncTest() {
    python.resolve(python.dummyFunction(), setDummyResult);
  }

  useEffect(() => {
    dummyFuncTest();
  }, []);

  function restartMusicPlayer(newMusic: string) {
    if (menuMusic !== null) {
      menuMusic.pause();
      menuMusic.currentTime = 0;
      setMenuMusic(null);
    }
    // This makes sure if you are in a game, music doesn't start playing
    if (newMusic !== "None" && gamesRunning.length === 0) {
      const currentPack = soundPacks.find((e) => e.name === newMusic);
      let musicFileName = "menu_music.mp3";
      if (Object.keys(currentPack?.mappings || {}).includes("menu_music.mp3")) {
        const randIndex = Math.trunc(
          Math.random() * currentPack?.mappings["menu_music.mp3"].length
        );
        musicFileName = currentPack?.mappings["menu_music.mp3"][randIndex];
      }
      const newMenuMusic = new Audio(
        `/sounds_custom/${currentPack?.path || "error"}/${musicFileName}`
      );
      newMenuMusic.play();
      newMenuMusic.loop = true;
      newMenuMusic.volume = musicVolume;
      setMenuMusic(newMenuMusic);
    }
  }

  function refetchLocalPacks() {
    python.resolve(python.reloadPacksDir(), () => {
      python.resolve(python.getSoundPacks(), (data: any) => {
        setSoundPacks(data);
      });
    });
  }

  const SoundPackDropdownOptions = useMemo(() => {
    return [
      { label: "Default", data: -1 },
      ...soundPacks
        // Only shows sound packs
        .filter((e) => !e.data.music)
        .map((p, index) => ({ label: p.name, data: index }))
        // TODO: because this sorts after assigning indexes, the sort might make the indexes out of order, make sure this doesn't happen
        .sort((a, b) => a.label.localeCompare(b.label)),
    ];
  }, [soundPacks]);

  const MusicPackDropdownOptions = useMemo(() => {
    return [
      { label: "None", data: -1 },
      ...soundPacks
        // Only show music packs
        .filter((e) => e.data.music)
        .map((p, index) => ({ label: p.name, data: index }))
        // TODO: because this sorts after assigning indexes, the sort might make the indexes out of order, make sure this doesn't happen
        .sort((a, b) => a.label.localeCompare(b.label)),
    ];
  }, [soundPacks]);

  if (!dummyFuncResult) {
    return (
      <PanelSectionRow>
        <span>
          AudioLoader failed to initialize, try reloading, and if that doesn't
          work, try restarting your deck.
        </span>
      </PanelSectionRow>
    );
  }

  return (
    <div className="audioloader_QAM">
      <style>
        {`
        .audioloader_QAM div[class^="gamepaddialog_FieldLabel_"] {
          display: none;
        }
        `}
      </style>
      <PanelSection title="Packs">
        <PanelSectionRow>
          <DropdownItem
            bottomSeparator="none"
            onMenuWillOpen={() => refetchLocalPacks()}
            menuLabel="Sound Pack"
            rgOptions={SoundPackDropdownOptions}
            selectedOption={
              // activeSound now stores a string, this just finds the corresponding option for the label
              // the "?? -2" is there incase find returns undefined (the currently selected theme was deleted or something)
              // it NEEDS to be a nullish coalescing operator because 0 needs to be treated as true
              SoundPackDropdownOptions.find((e) => e.label === activeSound)
                ?.data ?? -1
            }
            onChange={async (option) => {
              setActiveSound(option.label as string);

              const configObj = {
                selected_pack: option.label,
                selected_music: selectedMusic,
                sound_volume: soundVolume,
                music_volume: musicVolume,
              };
              python.setConfig(configObj);
            }}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <SliderField
            bottomSeparator="standard"
            label={undefined}
            value={soundVolume}
            min={0}
            max={1}
            step={0.01}
            onChange={(value) => {
              gainNode.gain.setValueAtTime(
                value,
                gainNode.context.currentTime + 0.01
              );
              // gainNode.gain.value = value;
              setSoundVolume(value);
              const configObj = {
                selected_pack: activeSound,
                selected_music: selectedMusic,
                sound_volume: value,
                music_volume: musicVolume,
              };
              python.setConfig(configObj);
            }}
            icon={<FaVolumeUp />}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <DropdownItem
            bottomSeparator="none"
            onMenuWillOpen={() => refetchLocalPacks()}
            menuLabel="Music Pack"
            rgOptions={MusicPackDropdownOptions}
            selectedOption={
              MusicPackDropdownOptions.find((e) => e.label === selectedMusic)
                ?.data ?? -1
            }
            onChange={async (option) => {
              setSelectedMusic(option.label as string);

              const configObj = {
                selected_pack: activeSound,
                selected_music: option.label,
                sound_volume: soundVolume,
                music_volume: musicVolume,
              };
              python.setConfig(configObj);
              restartMusicPlayer(option.label as string);
            }}
          />
        </PanelSectionRow>
        <PanelSectionRow>
          <SliderField
            bottomSeparator="standard"
            label={undefined}
            value={musicVolume}
            min={0}
            max={1}
            step={0.01}
            onChange={(value) => {
              setMusicVolume(value);
              menuMusic.volume = value;
              const configObj = {
                selected_pack: activeSound,
                selected_music: selectedMusic,
                sound_volume: soundVolume,
                music_volume: value,
              };
              python.setConfig(configObj);
            }}
            icon={
              <FaMusic
                style={{ transform: "scale(0.8, 1) translate(-2px, -2px)" }}
              />
            }
          />
        </PanelSectionRow>
      </PanelSection>
      <PanelSection title="Settings">
        <PanelSectionRow>
          <ButtonItem
            bottomSeparator="none"
            layout="below"
            onClick={() => {
              Router.CloseSideMenus();
              Router.Navigate("/audiopack-manager");
            }}
          >
            Manage Packs
          </ButtonItem>
        </PanelSectionRow>
      </PanelSection>
    </div>
  );
};

const PackManagerRouter: VFC = () => {
  const [currentTabRoute, setCurrentTabRoute] = useState<string>("browser");
  return (
    <div
      style={{
        marginTop: "40px",
        height: "calc(100% - 40px)",
        background: "#0005",
      }}
    >
      <Tabs
        activeTab={currentTabRoute}
        // @ts-ignore
        onShowTab={(tabID: string) => {
          setCurrentTabRoute(tabID);
        }}
        tabs={[
          {
            title: "Browse",
            content: <PackBrowserPage />,
            id: "browser",
          },
          {
            title: "Uninstall",
            content: <UninstallPage />,
            id: "uninstall",
          },
          {
            title: "About",
            content: <AboutPage />,
            id: "about",
          },
        ]}
      />
    </div>
  );
};

export default definePlugin((serverApi: ServerAPI) => {
  python.setServer(serverApi);
  const state: GlobalState = new GlobalState();
  let menuMusic: any = null;

  // Big thanks to AA and Mintexists for help finding this
  const soundVolumePatchInstance = afterPatch(
    AudioParent.m_GamepadUIAudioStore.m_AudioPlaybackManager.__proto__,
    "GetActiveDestination",
    function (_, ret) {
      const { soundVolume } = state.getPublicState();
      // @ts-ignore
      const gainNode = new GainNode(this.context, { gain: soundVolume });
      gainNode.connect(ret);
      try {
        state.setGainNode(gainNode);
      } catch (e) {
        console.log(e);
      }
      return gainNode;
    }
  );
  state.setVolumePatchInstance(soundVolumePatchInstance);

  // The sound effect intercept/player
  // Needs to be stored in globalstate in order to unpatch
  const patchInstance = beforePatch(
    AudioParent.GamepadUIAudio.m_AudioPlaybackManager.__proto__,
    "PlayAudioURL",
    (args) => {
      // Since this isn't in a react component, this uses the getter function of the globalState instead of just the react variables
      // It does the same thing
      const { soundPacks, activeSound } = state.getPublicState();
      let newSoundURL: string = "";
      switch (activeSound) {
        case "Default":
          newSoundURL = args[0];
          break;
        default:
          const soundName = args[0].slice(8);
          const currentPack = soundPacks.find((e) => e.name === activeSound);
          // Ignore check
          if (currentPack?.ignore.includes(soundName)) {
            newSoundURL = args[0];
            break;
          }
          // Mapping check
          if (Object.keys(currentPack?.mappings || {}).includes(soundName)) {
            const randIndex = Math.trunc(
              Math.random() * currentPack?.mappings[soundName].length
            );
            const mappedFileName = currentPack?.mappings[soundName][randIndex];
            newSoundURL = `/sounds_custom/${
              currentPack?.path || "/error"
            }/${mappedFileName}`;
            break;
          }
          // Default path-replacing behavior
          newSoundURL = args[0].replace(
            "sounds/",
            `sounds_custom/${currentPack?.path || "/error"}/`
          );
          break;
      }
      args[0] = newSoundURL;
      return [newSoundURL];
    }
  );
  state.setSoundPatchInstance(patchInstance);

  python.resolve(python.getSoundPacks(), (packs: any) => {
    state.setSoundPacks(packs);
    // This is nested in here so that all data has loaded before it attempts to find audio paths
    python.resolve(python.getConfig(), (data: any) => {
      // This sets the config data in globalState
      state.setActiveSound(data?.selected_pack || "Default");
      const configSelectedMusic = data?.selected_music || "None";
      state.setSelectedMusic(configSelectedMusic);
      const configSoundVolume = data?.sound_volume ?? 1;
      state.setSoundVolume(configSoundVolume);
      const configMusicVolume = data?.music_volume ?? 0.5;
      state.setMusicVolume(configMusicVolume);

      // Plays menu music initially
      // TODO: Add check if game is currently running
      if (configSelectedMusic !== "None") {
        const { soundPacks } = state.getPublicState();
        const currentPack = soundPacks.find(
          (e) => e.name === configSelectedMusic
        );
        let musicFileName = "menu_music.mp3";
        if (
          Object.keys(currentPack?.mappings || {}).includes("menu_music.mp3")
        ) {
          const randIndex = Math.trunc(
            Math.random() * currentPack?.mappings["menu_music.mp3"].length
          );
          musicFileName = currentPack?.mappings["menu_music.mp3"][randIndex];
        }
        menuMusic = new Audio(
          `/sounds_custom/${currentPack?.path || "error"}/${musicFileName}`
        );
        menuMusic.play();
        menuMusic.loop = true;
        menuMusic.volume = configMusicVolume;
        console.log("play and loop ran", menuMusic);
        state.setMenuMusic(menuMusic);
      }
    });
  });

  const AppStateRegistrar =
    // SteamClient is something exposed by the SP tab of SteamUI, it's not a decky-frontend-lib thingy, but you can still call it normally
    // Refer to the SteamClient.d.ts or just console.log(SteamClient) to see all of it's methods
    SteamClient.GameSessions.RegisterForAppLifetimeNotifications(
      (update: AppState) => {
        const {
          soundPacks,
          menuMusic,
          selectedMusic,
          gamesRunning,
          musicVolume,
        } = state.getPublicState();
        if (selectedMusic !== "None") {
          if (update.bRunning) {
            // Because gamesRunning is in globalState, array methods like push and splice don't work
            state.setGamesRunning([...gamesRunning, update.unAppID]);
            if (menuMusic != null) {
              menuMusic.pause();
              menuMusic.currentTime = 0;
              state.setMenuMusic(null);
            }
          } else {
            state.setGamesRunning(
              gamesRunning.filter((e) => e !== update.unAppID)
            );

            // I'm re-using the filter here because I don't believe the getPublicState() method will update the values if they are changed
            if (gamesRunning.filter((e) => e !== update.unAppID).length === 0) {
              const currentMusic = soundPacks.find(
                (e) => e.name === selectedMusic
              );
              let musicFileName = "menu_music.mp3";
              if (
                Object.keys(currentMusic?.mappings || {}).includes(
                  "menu_music.mp3"
                )
              ) {
                const randIndex = Math.trunc(
                  Math.random() *
                    currentMusic?.mappings["menu_music.mp3"].length
                );
                musicFileName =
                  currentMusic?.mappings["menu_music.mp3"][randIndex];
              }
              const newMenuMusic = new Audio(
                `/sounds_custom/${
                  currentMusic?.path || "error"
                }/${musicFileName}`
              );
              newMenuMusic.play();
              newMenuMusic.loop = true;
              newMenuMusic.volume = musicVolume;
              // Update menuMusic in globalState after every change so that it reflects the changes the next time it checks
              state.setMenuMusic(newMenuMusic);
            }
          }
        }
      }
    );

  serverApi.routerHook.addRoute("/audiopack-manager", () => (
    <GlobalStateContextProvider globalStateClass={state}>
      <PackManagerRouter />
    </GlobalStateContextProvider>
  ));

  return {
    title: <div className={staticClasses.Title}>Audio Loader</div>,
    content: (
      <GlobalStateContextProvider globalStateClass={state}>
        <Content serverAPI={serverApi} />
      </GlobalStateContextProvider>
    ),
    icon: <RiFolderMusicFill />,
    onDismount: () => {
      const { menuMusic, soundPatchInstance, volumePatchInstance } =
        state.getPublicState();
      if (menuMusic != null) {
        menuMusic.pause();
        menuMusic.currentTime = 0;
        state.setMenuMusic(null);
      }
      soundPatchInstance.unpatch();
      volumePatchInstance.unpatch();
      AppStateRegistrar.unregister();
    },
  };
});
