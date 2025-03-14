// types/global.d.ts
import React from "react";

declare module "react" {
  interface HTMLAttributes<T> extends React.ClassAttributes<T> {
    className?: string;
  }
}
