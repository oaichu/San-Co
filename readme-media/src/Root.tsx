import React from "react";
import { Composition } from "remotion";
import { Banner } from "./Banner";
import { Showcase } from "./Showcase";

export const Root: React.FC = () => (
  <>
    <Composition id="Banner" component={Banner} durationInFrames={150} fps={30} width={1280} height={360} />
    <Composition id="Showcase" component={Showcase} durationInFrames={240} fps={30} width={960} height={540} />
  </>
);
