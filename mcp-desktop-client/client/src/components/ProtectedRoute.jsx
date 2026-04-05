import { Navigate } from "react-router-dom";
import useGlobalStore from "@/store/globalStore";

const ProtectedRoute = ({ children }) => {
	const logged = useGlobalStore((state) => state.logged);

	if (!logged) {
		// toast.error("Please login first");
		return <Navigate to="/login" replace />;
	}

	return children;
};

export default ProtectedRoute;
