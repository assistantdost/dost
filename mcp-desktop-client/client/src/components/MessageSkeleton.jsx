import React from "react";
import { Message, MessageContent } from "@/components/ai/message";

const MessageSkeleton = () => {
	return (
		<div className="space-y-0">
			{/* Skeleton for user message */}
			<Message from="user">
				<MessageContent className="animate-pulse">
					<div className="w-60 h-4"></div>
				</MessageContent>
			</Message>

			{/* Skeleton for assistant message */}
			<Message from="assistant">
				<MessageContent className="animate-pulse">
					<div className="w-80 h-4 "></div>
				</MessageContent>
			</Message>
		</div>
	);
};

export default MessageSkeleton;
