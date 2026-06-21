import { propsFor, register } from "prop-for-that";
import { network } from "prop-for-that/plugins";

register(network);
propsFor(["network"]);
