import { FC } from "react";
import { PanelSectionRow, ButtonItem, Focusable } from "decky-frontend-lib";
// import { motion } from "framer-motion";
import { useGlobalState } from "../state/GlobalState";
import { Pack } from "../classes";
import { PartialCSSThemeInfo, ThemeQueryRequest } from "../apiTypes";
import { AiOutlineDownload } from "react-icons/ai";

export const PackDisplayCard: FC<{
  data: PartialCSSThemeInfo;
  refPassthrough?: any;
  searchOpts: ThemeQueryRequest;
  prevSearchOptsVarName: string;
}> = ({
  data: e,
  refPassthrough = undefined,
  searchOpts,
  prevSearchOptsVarName,
}) => {
  const { soundPacks, isInstalling, apiUrl, setGlobalState } = useGlobalState();
  function checkIfPackInstalled(themeObj: PartialCSSThemeInfo) {
    const filteredArr: Pack[] = soundPacks.filter(
      (e: Pack) =>
        e.name === themeObj.name && e.author === themeObj.specifiedAuthor
    );
    if (filteredArr.length > 0) {
      if (filteredArr[0].version === themeObj.version) {
        return "installed";
      } else {
        return "outdated";
      }
    } else {
      return "uninstalled";
    }
  }

  function imageURLCreator(): string {
    if (e?.images[0]?.id && e.images[0].id !== "MISSING") {
      return `url(${apiUrl}/blobs/${e?.images[0].id})`;
    } else {
      return `url(https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Steam_Deck_logo_%28blue_background%29.svg/2048px-Steam_Deck_logo_%28blue_background%29.svg.png)`;
    }
  }

  const installStatus = checkIfPackInstalled(e);
  return (
    // The outer 2 most divs are the background darkened/blurred image, and everything inside is the text/image/buttons
    <div style={{ position: "relative" }}>
      {installStatus === "outdated" && (
        <div
          className="CssLoader_ThemeBrowser_SingleItem_NotifBubble"
          style={{
            position: "absolute",
            top: "-5px",
            left: "-5px",
            padding: "4px 5px 2.5px",
            fontSize: "0.5em",
            background: "linear-gradient(135deg, #3a9bed, #235ecf)",
            borderRadius: "50%",
            // The focusRing has a z index of 10000, so this is just to be cheeky
            zIndex: "10001",
            boxShadow:
              "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
          }}
        >
          <AiOutlineDownload />
        </div>
      )}
      <Focusable
        ref={refPassthrough}
        onActivate={() => {
          setGlobalState(prevSearchOptsVarName, searchOpts);
          setGlobalState("currentExpandedTheme", e);
        }}
        focusWithinClassName="gpfocuswithin"
        className="AudioLoader_PackBrowser_SingleItem_Container1"
        style={{
          width: "100%",
          marginLeft: "10px",
          marginRight: "10px",
          marginBottom: "20px",
        }}
      >
        <div
          className="AudioLoader_PackBrowser_SingleItem_Container2"
          style={{
            // Really this could be combined with the above div, its just that in CSSLoader there's 2 here, and I didn't want to merge them because its 1am
            width: "100%",
            display: "flex",
            alignItems: "center",
            height: "100%",
          }}
        >
          <div
            // I'm still using the format of div-with-a-bg-image, because I think that could make it a bit easier to add icons/text in front if we want
            className="AudioLoader_PackBrowser_SingleItem_PreviewImageContainer"
            style={{
              width: "200px",
              height: "200px",
              position: "relative",
            }}
          >
            <div
              style={{
                background:
                  e.target === "Music"
                    ? "url(https://i.imgur.com/nISGpci.png)"
                    : "linear-gradient(150deg, rgba(0, 0, 0, 0) 0%, rgba(118, 118, 118, 0) 0%, rgba(255, 255, 255, 0.2) 32%, rgba(255, 255, 255, 0.2) 35%, rgba(255, 255, 255, 0.2) 38%, rgba(210, 210, 210, 0) 70%, rgba(0, 0, 0, 0) 100%) 0% 0% / cover",
                position: "absolute",
                top: "10%",
                left: "0",
                width: "80%",
                height: "80%",
                backgroundSize: "cover",
                zIndex: 3,
                borderRadius: "2px",
              }}
            />
            <div
              style={{
                backgroundImage: imageURLCreator(),
                backgroundColor: "#21323d",
                position: "absolute",
                top: "10%",
                left: "0",
                width: "80%",
                height: "80%",
                backgroundSize: "cover",
                zIndex: 2,
                borderRadius: "2px",
              }}
            />
            <div
              // @ts-ignore - stupid "ref could be null" things here
              // animate={installRef.current === i ? { rotate: 360 } : {}}
              // exit={{}}
              // transition={{
              //   // @ts-ignore
              //   repeat: installRef.current === i ? Infinity : 0,
              //   // @ts-ignore
              //   duration: installRef.current === i ? 1.82 : 0.001,
              //   ease: "linear",
              // }}
              style={{
                backgroundImage:
                  e.target === "Music"
                    ? 'url("https://i.imgur.com/V9t3728.png")'
                    : 'url("https://i.imgur.com/pWm35T0.png")',
                position: "absolute",
                top: "12.5%",
                right: "0",
                width: "75%",
                height: "75%",
                backgroundSize: "cover",
                // zIndex: 1,
                // rotate: 0,
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              marginLeft: "1em",
              justifyContent: "center",
            }}
          >
            <span
              className="AudioLoader_PackBrowser_SingleItem_ThemeName"
              style={{
                fontSize: "1.25em",
                fontWeight: "bold",
                // This stuff here truncates it if it's too long (prolly not gonna happen on audioloader, just code from cssloader)
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                width: "90%",
              }}
            >
              {e.name}
            </span>
            <span
              className="AudioLoader_PackBrowser_SingleItem_AuthorText"
              style={{
                marginRight: "auto",
                fontSize: "1em",
                // The text shadows are leftover from cssloader, you can experiment with removing them if you want
                textShadow: "rgb(48, 48, 48) 0px 0 10px",
              }}
            >
              {e.specifiedAuthor}
            </span>
            <span
              className="AudioLoader_PackBrowser_SingleItem_ThemeTarget"
              style={{
                fontSize: "1em",
                textShadow: "rgb(48, 48, 48) 0px 0 10px",
              }}
            >
              {e.target} | {e.version}
            </span>
          </div>
        </div>
      </Focusable>
    </div>
  );
};
