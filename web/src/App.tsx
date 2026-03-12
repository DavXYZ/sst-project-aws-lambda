import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import "./App.css";
import { createItem, deleteItem, getItems, updateItem } from "./lib/api";
import type { Item } from "./lib/api";
import { supabase } from "./lib/supabase";
import { AuthCard } from "./components/AuthCard";
import { CreateItemCard } from "./components/CreateItemCard";
import { ItemsCard } from "./components/ItemsCard";
import { LoadingState } from "./components/LoadingState";
import { StatusBanner } from "./components/StatusBanner";
import { UserBar } from "./components/UserBar";

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [itemBusy, setItemBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const accessToken = session?.access_token;
  const userEmail = useMemo(() => session?.user.email ?? "", [session]);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setAuthReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!accessToken) {
      setItems([]);
      return;
    }

    void loadItems(accessToken);
  }, [accessToken]);

  async function loadItems(token: string) {
    setLoadingItems(true);
    setError("");
    try {
      const result = await getItems(token);
      setItems(result.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch items");
    } finally {
      setLoadingItems(false);
    }
  }

  async function handleSignUp() {
    setAuthBusy(true);
    setMessage("");
    setError("");

    try {
      const { error: authError } = await supabase.auth.signUp({ email, password });
      if (authError) {
        setError(authError.message);
        return;
      }

      setMessage("Signup successful. Check email if confirmation is enabled.");
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthBusy(true);
    setMessage("");
    setError("");

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        setError(authError.message);
        return;
      }

      setMessage("Logged in successfully.");
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleSignOut() {
    setAuthBusy(true);
    setMessage("");
    setError("");

    try {
      const { error: authError } = await supabase.auth.signOut();
      if (authError) {
        setError(authError.message);
        return;
      }

      setMessage("Logged out.");
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleCreateItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken) return;

    setItemBusy(true);
    setMessage("");
    setError("");
    try {
      await createItem(accessToken, { name: newName, description: newDescription });
      setNewName("");
      setNewDescription("");
      setMessage("Item created.");
      await loadItems(accessToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create item");
    } finally {
      setItemBusy(false);
    }
  }

  async function handleUpdateItem(item: Item) {
    if (!accessToken) return;

    const nextName = window.prompt("New name", item.name);
    if (nextName === null) return;

    const nextDescription = window.prompt("New description", item.description ?? "");
    if (nextDescription === null) return;

    setItemBusy(true);
    setMessage("");
    setError("");
    try {
      await updateItem(accessToken, item.id, { name: nextName, description: nextDescription });
      setMessage("Item updated.");
      await loadItems(accessToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update item");
    } finally {
      setItemBusy(false);
    }
  }

  async function handleDeleteItem(id: string) {
    if (!accessToken) return;
    if (!window.confirm("Delete this item?")) return;

    setItemBusy(true);
    setMessage("");
    setError("");
    try {
      await deleteItem(accessToken, id);
      setMessage("Item deleted.");
      await loadItems(accessToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete item");
    } finally {
      setItemBusy(false);
    }
  }

  if (!authReady) {
    return (
      <main className="app-shell">
        <LoadingState
          title="Preparing your workspace"
          subtitle="Checking authentication session..."
          fullscreen
        />
      </main>
    );
  }

  return (
    <main className="app-shell">
      <div className="container">
        <header className="hero">
          <p className="eyebrow">SST + Supabase</p>
          <h1>Beautiful CRUD Dashboard</h1>
          <p className="muted">Authenticate with Supabase and manage your items securely.</p>
        </header>

        <StatusBanner message={message} error={error} />

        {!session ? (
          <AuthCard
            email={email}
            password={password}
            busy={authBusy}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onSignIn={handleSignIn}
            onSignUp={() => void handleSignUp()}
          />
        ) : (
          <>
            <UserBar email={userEmail} onLogout={() => void handleSignOut()} busy={authBusy} />
            <CreateItemCard
              name={newName}
              description={newDescription}
              busy={itemBusy}
              onNameChange={setNewName}
              onDescriptionChange={setNewDescription}
              onCreate={handleCreateItem}
            />
            <ItemsCard
              items={items}
              loading={loadingItems}
              busy={itemBusy}
              onRefresh={() => {
                if (accessToken) void loadItems(accessToken);
              }}
              onUpdate={(item) => {
                void handleUpdateItem(item);
              }}
              onDelete={(id) => {
                void handleDeleteItem(id);
              }}
            />
          </>
        )}

        {itemBusy ? (
          <div className="overlay" aria-hidden="true">
            <LoadingState title="Saving changes" subtitle="Please wait..." />
          </div>
        ) : null}
      </div>
    </main>
  );
}

export default App;
