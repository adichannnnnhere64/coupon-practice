import { jsx as _jsx } from "react/jsx-runtime";
const StoreWrapper = (props) => {
    return (_jsx("div", { className: "grid md:grid-cols-4  grid-cols-2 gap-4", children: props.children }));
};
export default StoreWrapper;
