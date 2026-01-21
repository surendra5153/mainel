import React, { useCallback } from 'react';
import ReactFlow, {
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
// import { SKILL_DATA } from '../data/skillTreeData'; // Dynamic now

const fitViewOptions = { padding: 0.2 };

export default function SkillTree({ userSkills = [], nodes: propNodes = [], edges: propEdges = [] }) {
    // Process nodes to highlight acquired skills
    // We re-compute this when userSkills or propNodes change
    const processedNodes = React.useMemo(() => {
        return propNodes.map(node => ({
            ...node,
            style: {
                background: userSkills.some(s => s.toLowerCase().includes(node.data.label.toLowerCase())) ? '#10B981' : '#fff',
                color: userSkills.some(s => s.toLowerCase().includes(node.data.label.toLowerCase())) ? '#fff' : '#333',
                border: '1px solid #777',
                width: 180,
                cursor: 'pointer' // Add pointer to indicate interactivity if needed
            }
        }));
    }, [propNodes, userSkills]);

    // Use internal state for React Flow interactivity, synced with props
    const [nodes, setNodes, onNodesChange] = useNodesState(processedNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(propEdges);

    // Sync state if props change (e.g. switching roadmaps)
    React.useEffect(() => {
        setNodes(processedNodes);
        setEdges(propEdges);
    }, [processedNodes, propEdges, setNodes, setEdges]);

    return (
        <div style={{ height: 600, border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
                fitViewOptions={fitViewOptions}
                attributionPosition="bottom-right"
            >
                <Background color="#aaa" gap={16} />
                <Controls />
            </ReactFlow>
        </div>
    );
}
