import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

const ProtectedRoute = ({ children }) => {
	const { logged } = useAuthStore();

	if (!logged) {
		// toast.error("Please login first");
		return <Navigate to="/login" replace />;
	}

	return children;
};

export default ProtectedRoute;
