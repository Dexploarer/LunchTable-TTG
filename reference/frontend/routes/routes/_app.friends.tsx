import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFriendsInteraction } from "@/hooks/social/useFriendsInteraction";
import { cn } from "@/lib/utils";
import type { Friend } from "@/types";
import type { Id } from "@convex/_generated/dataModel";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Check,
  Clock,
  Loader2,
  MessageSquare,
  Search,
  Swords,
  UserMinus,
  UserPlus,
  Users,
  X,
} from "lucide-react";

export const Route = createFileRoute("/_app/friends")({
  component: FriendsPage,
});

function FriendsPage() {
  const {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    tabs,
    filteredOnline,
    offlineFriends,
    incomingRequests,
    outgoingRequests,
    acceptFriendRequest,
    cancelFriendRequest,
    declineFriendRequest,
    removeFriend,
    blockedUsers,
    unblockUser,
    isLoading,
    showAddFriend,
    setShowAddFriend,
    addFriendUsername,
    setAddFriendUsername,
    handleAddFriend,
    isAdding,
    confirmRemove,
    setConfirmRemove,
    handleMessage,
  } = useFriendsInteraction();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background scanner-noise">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background scanner-noise pt-12">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23121212' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="container mx-auto px-4 py-12 relative z-10 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-end justify-between gap-6 mb-12">
          <div className="text-center sm:text-left">
            <h1 className="text-6xl font-black text-black uppercase tracking-tighter ink-bleed-advanced relative z-10">
              Social Circle
            </h1>
            <p className="text-primary/60 font-bold uppercase tracking-widest text-sm mt-2 border-l-4 border-primary pl-4">
              Build your alliance. Challenge rivals.
            </p>
          </div>
          <Button
            onClick={() => setShowAddFriend(true)}
            className="h-14 px-8 bg-primary hover:bg-primary/90 text-white font-black text-lg uppercase tracking-wider border-2 border-primary shadow-zine hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-zine-sm transition-all ink-wash"
          >
            <UserPlus className="w-6 h-6 mr-3" />
            <span className="ink-bleed">Add Friend</span>
          </Button>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as "friends" | "requests" | "blocked")}
          className="space-y-8"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-primary/20 pb-6">
            <TabsList className="bg-transparent p-0 h-auto gap-2 flex-wrap">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="data-[state=active]:bg-primary data-[state=active]:text-white bg-white text-black border-2 border-primary px-6 py-3 font-black uppercase tracking-wider shadow-zine-sm data-[state=active]:-translate-x-0.5 data-[state=active]:-translate-y-0.5 data-[state=active]:shadow-zine hover:shadow-zine hover:-translate-y-0.5 transition-all text-sm"
                >
                  <span className="ink-bleed">{tab.label}</span>
                  {tab.count > 0 && (
                    <Badge
                      variant="secondary"
                      className="bg-reputation text-primary border-2 border-primary ml-2 px-1.5 min-w-5 font-bold shadow-zine-sm"
                    >
                      {tab.count}
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Search - Only on friends tab */}
            {activeTab === "friends" && (
              <div className="relative w-full max-w-xs group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40 group-focus-within:text-black transition-colors" />
                <Input
                  placeholder="SEARCH FRIENDS..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 bg-white border-2 border-primary rounded-none font-bold uppercase placeholder:text-primary/30 text-primary shadow-zine-sm focus-visible:ring-0 focus-visible:shadow-zine transition-all"
                />
              </div>
            )}
          </div>

          {/* Content: Friends */}
          <TabsContent
            value="friends"
            className="space-y-12 outline-none mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            {filteredOnline.length === 0 && offlineFriends.length === 0 ? (
              <div className="text-center py-20 bg-white border-zine shadow-zine ink-wash">
                <div className="w-20 h-20 bg-slate-100 border-zine rounded-full flex items-center justify-center mx-auto mb-6 transform -rotate-6">
                  <Users className="w-10 h-10 text-primary/40" />
                </div>
                <h3 className="text-2xl font-black text-black uppercase tracking-tight mb-2">
                  No Friends Yet
                </h3>
                <p className="text-black/60 font-bold mb-8 max-w-md mx-auto">
                  Your circle is empty. Add friends to start battling and trading!
                </p>
                <Button
                  onClick={() => setShowAddFriend(true)}
                  variant="outline"
                  className="h-12 border-zine font-black uppercase tracking-wider hover:bg-black hover:text-white transition-colors"
                >
                  Find Champions
                </Button>
              </div>
            ) : (
              <>
                {/* Online Friends */}
                {filteredOnline.length > 0 && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-black text-primary uppercase tracking-widest flex items-center gap-3 border-b border-primary/10 pb-2">
                      <span className="w-3 h-3 rounded-none bg-green-500 border border-primary shadow-zine-sm" />
                      Online ({filteredOnline.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredOnline.map((friend) => (
                        <FriendCard
                          key={friend.friendId}
                          friend={friend}
                          onMessage={() => handleMessage(friend.userId)}
                          onRemove={() => setConfirmRemove(friend.userId)}
                          isOnline
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Offline Friends */}
                {offlineFriends.length > 0 && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-black text-black/50 uppercase tracking-widest flex items-center gap-3 border-b border-black/10 pb-2">
                      <span className="w-3 h-3 rounded-none bg-slate-400 border border-black/50" />
                      Offline ({offlineFriends.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {offlineFriends.map((friend) => (
                        <FriendCard
                          key={friend.friendId}
                          friend={friend}
                          onMessage={() => handleMessage(friend.userId)}
                          onRemove={() => setConfirmRemove(friend.userId)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Content: Requests */}
          <TabsContent
            value="requests"
            className="space-y-12 outline-none mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            {/* Incoming */}
            <div className="space-y-6">
              <h3 className="text-lg font-black text-black uppercase tracking-widest flex items-center gap-3 border-b border-black/10 pb-2">
                Incoming Requests
              </h3>
              {incomingRequests.length === 0 ? (
                <p className="text-sm font-bold text-black/40 italic pl-4 border-l-2 border-black/10">
                  No pending requests.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {incomingRequests.map((req) => (
                    <div
                      key={req.requestId}
                      className="p-4 bg-white border-zine shadow-zine flex items-center justify-between gap-4 ink-wash"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 border-zine rounded-none">
                          <AvatarFallback className="bg-slate-200 text-primary font-black uppercase">
                            {req.username[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-black text-black uppercase leading-none mb-1">
                            {req.username}
                          </p>
                          <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide">
                            Wants to join
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => declineFriendRequest(req.userId)}
                          className="h-8 w-8 hover:bg-red-100 hover:text-red-600 rounded-none border-2 border-transparent hover:border-red-600 transition-all"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          onClick={() => acceptFriendRequest(req.userId)}
                          className="h-8 w-8 bg-green-500 hover:bg-green-600 text-primary border-zine shadow-zine-sm hover:-translate-x-0.5 hover:-translate-y-0.5 rounded-none transition-all"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Outgoing */}
            <div className="space-y-6">
              <h3 className="text-lg font-black text-black/50 uppercase tracking-widest flex items-center gap-3 border-b border-black/10 pb-2">
                Sent Requests
              </h3>
              {outgoingRequests.length === 0 ? (
                <p className="text-sm font-bold text-black/40 italic pl-4 border-l-2 border-black/10">
                  No sent requests.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {outgoingRequests.map((req) => (
                    <div
                      key={req.requestId}
                      className="p-4 bg-slate-50 border-zine border-dashed flex items-center justify-between gap-4 opacity-80 hover:opacity-100 transition-opacity"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 border-2 border-black/30 grayscale rounded-none">
                          <AvatarFallback>{req.username[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-black uppercase leading-none mb-1">
                            {req.username}
                          </p>
                          <p className="text-[10px] font-bold text-black/50 uppercase tracking-wide flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Pending
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => cancelFriendRequest(req.userId)}
                        className="h-8 border-2 border-black/30 hover:border-red-600 hover:text-red-600 hover:bg-red-50 rounded-none font-bold text-xs uppercase"
                      >
                        Cancel
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Content: Blocked */}
          <TabsContent
            value="blocked"
            className="space-y-6 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <h3 className="text-lg font-black text-black/50 uppercase tracking-widest flex items-center gap-3 border-b border-black/10 pb-2">
              Blocked Users
            </h3>
            {blockedUsers?.length === 0 ? (
              <p className="text-sm font-bold text-black/40 italic pl-4 border-l-2 border-black/10">
                No blocked users.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {blockedUsers?.map((user) => (
                  <div
                    key={user.userId}
                    className="p-4 bg-slate-100 border-[3px] border-black/20 flex items-center justify-between gap-4 grayscale hover:grayscale-0 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 border-2 border-black/20 rounded-none">
                        <AvatarFallback>{user.username[0]}</AvatarFallback>
                      </Avatar>
                      <p className="font-bold text-black uppercase">{user.username}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => unblockUser(user.userId)}
                      className="border-zine hover:border-black font-bold uppercase rounded-none"
                    >
                      Unblock
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Friend Dialog */}
      <Dialog open={showAddFriend} onOpenChange={setShowAddFriend}>
        <DialogContent className="border-zine shadow-zine-lg p-0 gap-0 max-w-md bg-white rounded-none sm:rounded-none overflow-hidden">
          <div className="bg-indigo-600 p-6">
            <DialogHeader className="text-white">
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
                <UserPlus className="w-6 h-6" />
                Add a Champion
              </DialogTitle>
              <DialogDescription className="text-indigo-100 font-medium">
                Enter the username of the player you want to add to your circle.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-black uppercase tracking-wider">
                Username
              </label>
              <Input
                placeholder="PLAYER NAME"
                value={addFriendUsername}
                onChange={(e) => setAddFriendUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddFriend()}
                className="h-12 border-zine rounded-none shadow-zine-sm focus-visible:ring-0 focus-visible:shadow-zine uppercase font-bold text-lg"
              />
            </div>

            <DialogFooter className="gap-3 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setShowAddFriend(false)}
                className="h-12 flex-1 border-[3px] border-black font-black uppercase tracking-wider rounded-none hover:bg-slate-100"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddFriend}
                disabled={!addFriendUsername.trim() || isAdding}
                className="h-12 flex-1 bg-indigo-600 text-white border-zine font-black uppercase tracking-wider rounded-none shadow-zine-sm hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-zine hover:bg-indigo-700 transition-all"
              >
                {isAdding && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                Send Request
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Friend Confirmation */}
      <Dialog open={!!confirmRemove} onOpenChange={(open) => !open && setConfirmRemove(null)}>
        <DialogContent className="border-zine shadow-zine-lg rounded-none bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase text-black flex items-center gap-2">
              <UserMinus className="w-5 h-5 text-red-600" />
              Remove Friend?
            </DialogTitle>
            <DialogDescription className="text-black/60 font-medium">
              Are you sure you want to remove this player from your friends list? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-3">
            <Button
              variant="outline"
              onClick={() => setConfirmRemove(null)}
              className="flex-1 h-10 border-zine font-black uppercase rounded-none hover:bg-slate-50"
            >
              Keep
            </Button>
            <Button
              onClick={() => {
                if (confirmRemove) removeFriend(confirmRemove as Id<"users">);
                setConfirmRemove(null);
              }}
              className="flex-1 h-10 bg-red-600 hover:bg-red-700 text-white border-zine font-black uppercase rounded-none shadow-zine-sm hover:shadow-zine hover:-translate-x-0.5 hover:-translate-y-0.5"
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FriendCard({
  friend,
  onMessage,
  onRemove,
  isOnline,
}: { friend: Friend; onMessage: () => void; onRemove: () => void; isOnline?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      className={cn(
        "group relative flex items-center gap-4 p-4 border-zine transition-all bg-white ink-wash",
        isOnline
          ? "shadow-zine"
          : "shadow-zine-sm opacity-60 grayscale hover:opacity-100 hover:grayscale-0 hover:shadow-zine"
      )}
    >
      <div className="relative">
        <Avatar className="w-14 h-14 border-zine rounded-none">
          {friend.image && <AvatarImage src={friend.image} />}
          <AvatarFallback
            className={cn(
              "font-black text-lg rounded-none uppercase",
              isOnline ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
            )}
          >
            {friend.username[0]}
          </AvatarFallback>
        </Avatar>
        {isOnline && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-zine shadow-zine-sm" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h4
          className={cn(
            "text-lg font-black truncate uppercase leading-none mb-1",
            isOnline ? "text-black" : "text-black/60 group-hover:text-black"
          )}
        >
          {friend.username}
        </h4>
        <p className="text-xs font-bold text-black/40 uppercase tracking-widest flex items-center gap-1 group-hover:text-indigo-600 transition-colors">
          {isOnline
            ? "Online Now"
            : `Last seen ${new Date(friend.lastInteraction || Date.now()).toLocaleDateString()}`}
        </p>
      </div>

      <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
        <Button
          size="icon"
          onClick={onMessage}
          className="h-8 w-8 bg-black text-white hover:bg-indigo-600 border border-black rounded-none shadow-zine-sm hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
          title="Send Message"
        >
          <MessageSquare className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          className="h-8 w-8 bg-white text-black hover:bg-orange-500 hover:text-white border-2 border-black rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-none transition-all"
        >
          <Swords className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          onClick={onRemove}
          className="h-8 w-8 bg-white text-black hover:bg-red-600 hover:text-white border-2 border-black rounded-none shadow-zine-sm hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
          title="Remove Friend"
        >
          <UserMinus className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}
