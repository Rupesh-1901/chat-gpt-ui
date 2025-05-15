import React, { useEffect, useState } from 'react'
import { AppsProvide, useApps } from './context'
import { classnames } from '@/components/utils'
import { useGlobal } from '../context'
import styles from './apps.module.less'
import { Search, Button } from '@/components'
import { auth } from '../context/firebase'
import { useAuth } from '../context/AuthContext'
import { CreateProfileModal } from '../component/CreateProfileModal'
import { message as antMessage, Modal, Tooltip } from 'antd'
import { DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons'

export function AppItem(props) {
  const { newChat, chat, currentChat } = useGlobal();
  const { dispatch, userPersonas } = useApps();
  
  // Get the displayable name for this item
  const itemName = props.title || props.persona_name;
  
  // Get the current active persona name from the chat
  const activePersonaName = chat[currentChat]?.persona?.title;
  
  console.log('Comparing:', {
    'Item Name': itemName,
    'Active Persona': activePersonaName,
    'Matches': itemName === activePersonaName
  });
  
  // This persona is active if its name matches the current active persona name
  const isActive = itemName === activePersonaName;
  
  const handleClick = () => {
    const persona = {
      title: props.title || props.persona_name,
      desc: props.desc || props.persona_bio,
      role: props.role,
      id: props.id
    };
    newChat(persona);
  };

  const handleDelete = async (e) => {
    e.stopPropagation(); // Prevent triggering the parent onClick
    console.log('Delete button clicked for persona with details:', {
      personaName: props.persona_name,
      personaType: props.persona_type,
      profileId: props.profileId,
      keys: Object.keys(props)
    });
    
    if (!props.persona_name) {
      antMessage.error('Cannot delete - persona does not have a name');
      return;
    }
    
    // For clarity, check what identifier we're using (ObjectId is preferred)
    const deleteIdentifier = props.profileId || props.persona_name;
    const identifierType = props.profileId ? 'ObjectId' : 'persona_name';
    
    console.log(`Will use ${identifierType} for deletion:`, deleteIdentifier);
    
    // Show confirmation modal
    Modal.confirm({
      title: (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {/* <ExclamationCircleOutlined style={{ color: '#FFC107', marginRight: '8px' }} /> */}
          <span>Delete Persona</span>
        </div>
      ),
      content: `Are you sure you want to delete "${props.persona_name}"?`,
      okText: 'Yes, Delete',
      okButtonProps: {
        danger: true,
        style: {
          backgroundColor: '#ff4d4f',
          borderColor: '#ff4d4f',
        }
      },
      cancelText: 'Cancel',
      onOk: () => {
        console.log('Delete confirmed for persona:', props.persona_name);
        return new Promise(async (resolve, reject) => {
          try {
            console.log('Using identifier for deletion:', deleteIdentifier);
            
            const encodedIdentifier = encodeURIComponent(deleteIdentifier);
            console.log('Encoded identifier for URL:', encodedIdentifier);
            
            const deleteUrl = `http://65.109.233.16:3001/api/personas/${encodedIdentifier}`;
            console.log('Delete URL:', deleteUrl);
            
            const response = await fetch(deleteUrl, {
              method: 'DELETE',
            });
            
            console.log('Delete response status:', response.status);
            
            const result = await response.json();
            console.log('Delete result:', result);
            
            if (result.success) {
              // Remove the persona from the local state
              const updatedUserPersonas = userPersonas.filter(p => {
                // If we deleted by ObjectId, filter by that
                if (props.profileId) {
                  return p.profileId !== props.profileId;
                }
                // Otherwise filter by name
                return p.persona_name !== props.persona_name;
              });
              
              console.log('Updated user personas after deletion:', updatedUserPersonas);
              
              dispatch({ 
                type: 'SET_USER_PERSONAS', 
                payload: updatedUserPersonas 
              });
              
              antMessage.success('Persona deleted successfully');
              resolve();
              
              // Refresh the page to update the UI
              setTimeout(() => {
                window.location.reload();
              }, 1000);
            } else {
              throw new Error(result.error || 'Delete operation reported failure');
            }
          } catch (error) {
            console.error('Error deleting persona:', error);
            antMessage.error('Failed to delete persona: ' + error.message);
            reject(error);
          }
        });
      }
    });
  };

  // Only show delete button for user-created personas (ones with persona_name)
  const showDeleteButton = !!props.persona_name;

  return (
    <div 
      className={classnames(
        styles.app, 
        isActive && styles.app_active
      )} 
      onClick={handleClick}
    >
      {/* <div className={classnames(styles.app_icon, `ico-prompts`)}></div> */}
      <div className={styles.app_content}>
        <div className={styles.app_title}>{props.title || props.persona_name}</div>
        <div className={styles.app_desc}>{props.desc || props.persona_bio}</div>
      </div>
      {isActive && (
        <div className={styles.app_indicator}>●</div>
      )}
      {showDeleteButton && (
        <Tooltip title="Delete Persona">
          <div className={styles.delete_button} onClick={handleDelete}>
            <DeleteOutlined />
          </div>
        </Tooltip>
      )}
    </div>
  )
}

export function Empty() {
  return (
    <div className={classnames(styles.empty, 'flex-column')}>
      <div className={classnames(styles.icon, 'ico-prompts')} />
      <div className={styles.empty_text}>No personas found</div>
    </div>
  )
}

export function Category(props) {
  const { setState, apps, current, category, userPersonas } = useApps();
  const defaultApps = apps.filter(item => item.id === category[current].id);
  
  // Debug logs
  console.log('Current category:', props.title);
  console.log('User Personas with persona_name check:', userPersonas.map(p => ({
    name: p.persona_name, 
    type: p.persona_type, 
    hasProfileId: !!p.profileId,
    profileId: p.profileId,
    keys: Object.keys(p)
  })));
  
  const userApps = userPersonas.filter(item => {
    console.log('Comparing:', {
      'persona_type': item.persona_type,
      'category_title': props.title,
      'matches': item.persona_type?.toLowerCase() === props.title?.toLowerCase(),
      'persona_name': item.persona_name
    });
    return item.persona_type?.toLowerCase() === props.title?.toLowerCase();
  });
  
  console.log('Filtered user apps:', userApps);
  
  const list = [...defaultApps, ...userApps];
  console.log('Combined list:', list);

  return (
    <div>
      <div className={classnames(styles.category, current === props.index && styles.current)} onClick={() => setState({ current: props.index })}>
        <div className={classnames(styles.icon, `ico-${props.icon}`)}></div>
        <div className={styles.category_title}>{props?.title}</div>
      </div>
      <div>
        {props.index === current && (list.length === 0 ? <Empty /> : list.map((item, index) => {
          console.log('Rendering item with details:', {
            item: item.title || item.persona_name,
            hasProfileId: !!item.profileId,
            profileId: item.profileId,
            persona_name: item.persona_name,
            keys: Object.keys(item)
          });
          return <AppItem {...item} key={index} />;
        }))}
      </div>
    </div>
  )
}

export function AppContainer() {
  const { category } = useApps();
  const [createProfileModalVisible, setCreateProfileModalVisible] = useState(false);
  const { currentUser } = useAuth();

  const handleCreatePersona = () => {
    if (!currentUser) {
      // TODO: Show login prompt
      return;
    }
    setCreateProfileModalVisible(true);
  };

  return (
    <div className={styles.apps}>
      {category.map((item, index) => <Category index={index} {...item} key={item.id} />)}
      <div className={styles.create_persona}>
        <Button
          type="primary"
          icon="add"
          block
          onClick={() => {
            const user = auth.currentUser;
            if (!user) {
              antMessage.error('Please login to create a persona');
              return;
            }
            setCreateProfileModalVisible(true);
          }}
        >
          Create Persona
        </Button>
      </div>
      <CreateProfileModal
        visible={createProfileModalVisible}
        onClose={() => setCreateProfileModalVisible(false)}
        isPersonaOnly={true}
      />
    </div>
  );
}

export function Apps() {
  const [userPersonas, setUserPersonas] = useState([]);

  useEffect(() => {
    const fetchUserPersonas = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          console.log('Fetching personas for user:', user.email);
          const response = await fetch(`http://65.109.233.16:3001/api/personas/${user.uid}/${user.email}`);
          console.log('Response status:', response.status);
          const data = await response.json();
          console.log('Data from API:', data);
          
          if (data.success) {
            // Ensure we have persona_name for each persona
            const validatedPersonas = data.personas.map(p => {
              if (!p.persona_name) {
                console.warn('Persona missing persona_name:', p);
              }
              return p;
            });
            
            console.log('Personas with persona_name check:', validatedPersonas.map(p => ({
              name: p.persona_name,
              type: p.persona_type,
              hasProfileId: !!p.profileId,
              profileId: p.profileId,
              keys: Object.keys(p)
            })));
            
            setUserPersonas(validatedPersonas);
          }
        } catch (error) {
          console.error('Error fetching user personas:', error);
        }
      } else {
        console.log('No user is logged in, cannot fetch personas');
      }
    };

    fetchUserPersonas();
  }, []);

  return (
    <AppsProvide initialUserPersonas={userPersonas}>
      <AppContainer />
    </AppsProvide>
  )
}