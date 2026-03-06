'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { getDesignById } from '@/data/designs';
import { calculateEstimatedPrice, formatPrice, deliveryCharges } from '@/utils/pricing';
import { FabricType, StandardSize, FabricSource, SizeType, DeliveryMethod } from '@/types';
import Button from '@/components/ui/Button';
import { Check, ChevronRight, AlertCircle, Clock, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { gtagEvent } from '@/lib/gtag';

const fabrics: FabricType[] = ['cotton', 'silk', 'satin', 'chiffon', 'velvet', 'georgette', 'organza', 'linen', 'crepe', 'net', 'brocade', 'chanderi', 'banarasi'];
const standardSizes: StandardSize[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
const measurementFields = ['bust', 'shoulderWidth', 'blouseWaist', 'pantWaist', 'hipCircumference', 'neckRound', 'sleeveLength', 'armhole', 'thighCircumference', 'ankleOpening', 'dressLength', 'topLength', 'bottomLength', 'inseam', 'outseam', 'waistToFloor'];
const measurementLabels: Record<string, string> = { bust: 'Bust', shoulderWidth: 'Shoulder Width', blouseWaist: 'Blouse Waist', pantWaist: 'Pant Waist', hipCircumference: 'Hip Circumference', neckRound: 'Neck Round', sleeveLength: 'Sleeve Length', armhole: 'Armhole', thighCircumference: 'Thigh Circumference', ankleOpening: 'Ankle Opening', dressLength: 'Dress Length', topLength: 'Top Length', bottomLength: 'Bottom Length', inseam: 'Inseam', outseam: 'Outseam', waistToFloor: 'Waist to Floor' };

const steps = ['Fabric & Style', 'Measurements', 'Delivery', 'Review & Submit'];

export default function NewOrderPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center pt-24"><div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <NewOrderContent />
    </Suspense>
  );
}

function NewOrderContent() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const designId = searchParams.get('designId');
  const requestId = searchParams.get('requestId');
  const staticDesign = designId ? getDesignById(designId) : null;
  const [design, setDesign] = useState<any>(staticDesign);
  const [customRequest, setCustomRequest] = useState<any>(null);
  const [designLoading, setDesignLoading] = useState(!!(designId || requestId));

  // Load from Firestore: either a listed design override, or a custom design request
  useEffect(() => {
    if (requestId) {
      // Loading from an approved custom design request
      getDoc(doc(db, 'customDesignRequests', requestId)).then(snap => {
        if (snap.exists()) {
          const r = snap.data();
          if (r.status !== 'approved') { setDesign(null); setDesignLoading(false); return; }
          setCustomRequest({ id: snap.id, ...r });
          // Build a pseudo-design object for the order form
          setDesign({
            id: `custom-${snap.id}`,
            name: `Custom Design — ${(r.category || 'design').replace(/-/g, ' ')}`,
            images: r.designImages || [],
            category: r.category || 'women-traditional',
            basePrice: r.budget || 500,
            productionTime: 21,
            complexity: 'medium',
            fabrics: [],
            isCustomDesign: true,
          });
        } else {
          setDesign(null);
        }
      }).catch(() => setDesign(null)).finally(() => setDesignLoading(false));
      return;
    }

    if (!designId) { setDesignLoading(false); return; }
    getDoc(doc(db, 'designs', designId)).then(snap => {
      if (snap.exists()) {
        const d = snap.data();
        if (d.active === false || d.deletedByAdmin === true) {
          setDesign(null);
        } else if (staticDesign) {
          // Merge: Firestore overrides static
          setDesign({ ...staticDesign, ...d, id: snap.id });
        } else {
          setDesign({
            id: snap.id,
            complexity: 'medium',
            fabrics: [],
            images: [],
            ...d,
            productionTime: (d.productionTime || d.productionDays || 14),
          });
        }
      } else if (!staticDesign) {
        setDesign(null);
      }
      // If no Firestore doc but staticDesign exists, keep staticDesign as-is
    }).catch(() => {
      // On error keep whatever we had
    }).finally(() => setDesignLoading(false));
  }, [designId, requestId]);

  // Derive fabric options for custom design requests
  const isProvideOwnFabric = customRequest?.userResponse?.type === 'provide-own';
  const adminSuggestedFabrics: FabricType[] = customRequest?.adminSuggestions?.fabrics?.length
    ? customRequest.adminSuggestions.fabrics
    : [];
  const availableFabrics: FabricType[] = customRequest
    ? (adminSuggestedFabrics.length > 0 ? adminSuggestedFabrics : fabrics)
    : fabrics;

  const [currentStep, setCurrentStep] = useState(0);
  const [fabric, setFabric] = useState<FabricType>('silk');
  const [fabricSource, setFabricSource] = useState<FabricSource>('nilkanth-sources');
  const [sizeType, setSizeType] = useState<SizeType>('standard');
  const [standardSize, setStandardSize] = useState<StandardSize>('M');
  const [measurements, setMeasurements] = useState<Record<string, string>>({});
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('home-delivery');
  const [address, setAddress] = useState({ street: '', city: '', province: '', postalCode: '', country: 'Canada' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [orderId, setOrderId] = useState('');

  // Pre-set fabric from custom request user response or first admin suggestion
  useEffect(() => {
    if (!customRequest) return;
    if (customRequest.userResponse?.selectedFabric) {
      setFabric(customRequest.userResponse.selectedFabric as FabricType);
    } else if (adminSuggestedFabrics.length > 0) {
      setFabric(adminSuggestedFabrics[0]);
    }
  }, [customRequest]);

  useEffect(() => {
    if (authLoading) return; // Wait for Firebase Auth to resolve before redirecting
    if (!user) { router.push(designId ? `/auth/login?redirect=/order/new?designId=${designId}` : '/auth/login'); return; }
    if (!designLoading && !design) { router.push('/collections'); return; }
    // Pre-fill measurements from profile
    if (userProfile?.measurements) {
      const m = userProfile.measurements as Record<string, any>;
      const filled: Record<string, string> = {};
      measurementFields.forEach(f => { if (m[f]) filled[f] = String(m[f]); });
      setMeasurements(filled);
    }
  }, [user, design, designLoading, userProfile, router]);

  const estimatedPrice = design ? calculateEstimatedPrice(design, fabric, fabricSource) : 0;
  const deliveryCharge = deliveryMethod === 'pickup' ? 0 : deliveryCharges.national;
  const totalPrice = estimatedPrice + deliveryCharge;

  const handleSubmitOrder = async () => {
    if (!user || !design) return;
    setSubmitting(true);
    try {
      const parsedMeasurements: Record<string, any> = {};
      Object.entries(measurements).forEach(([k, v]) => { if (v) parsedMeasurements[k] = parseFloat(v); });

      const orderData = {
        userId: user.uid,
        userName: user.displayName || userProfile?.displayName || '',
        userEmail: user.email,
        items: [{
          designId: design.id,
          designName: design.name,
          designImage: design.images[0] || '',
          quantity: 1,
          fabric,
          fabricSource,
          sizeType,
          standardSize: sizeType === 'standard' ? standardSize : null,
          measurements: sizeType === 'custom' ? parsedMeasurements : null,
          specialInstructions,
          basePrice: design.basePrice,
          fabricCost: 0,
          tailoringCost: estimatedPrice,
          totalItemPrice: estimatedPrice,
        }],
        status: 'pending-review',
        deliveryMethod,
        deliveryAddress: deliveryMethod === 'home-delivery' ? address : null,
        deliveryCharge,
        subtotal: estimatedPrice,
        totalAmount: totalPrice,
        estimatedDelivery: new Date(Date.now() + design.productionTime * 24 * 60 * 60 * 1000),
        isCustomDesign: !!customRequest,
        ...(customRequest ? { customDesignRequestId: customRequest.id, customDesignImages: customRequest.designImages || [], customDesignDescription: customRequest.description || '' } : {}),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);

      // Mark the custom design request as order-placed (best-effort — don't let this block success)
      if (customRequest) {
        try {
          await updateDoc(doc(db, 'customDesignRequests', customRequest.id), {
            status: 'order-placed',
            orderId: docRef.id,
            updatedAt: new Date(),
          });
        } catch (reqErr) {
          console.warn('Could not update custom design request status (non-fatal):', reqErr);
        }
      }

      setOrderId(docRef.id);
      setSubmitted(true);
      gtagEvent('purchase', { transaction_id: docRef.id, value: totalPrice, currency: 'CAD', items: [{ item_id: design.id, item_name: design.name, item_category: design.category }] });
      toast.success('Order submitted successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || designLoading) return <div className="min-h-screen flex items-center justify-center pt-24"><div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!design) return <div className="pt-32 text-center"><p>Design not found or request not approved. <Link href="/user/orders" className="text-rose-600">Back to orders</Link></p></div>;

  if (submitted) {
    return (
      <div className="pt-24 min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg w-full bg-white rounded-3xl p-10 text-center shadow-xl">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"><Check className="w-10 h-10 text-green-500" /></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
          <p className="text-gray-500 mb-2">Your order request <strong className="text-gray-800">#{orderId.slice(-6).toUpperCase()}</strong> is now under review.</p>
          <div className="bg-blue-50 rounded-xl p-4 mb-6 text-left text-sm text-blue-800">
            <div className="flex items-center gap-2 mb-2"><Clock className="w-4 h-4" /><strong>What happens next:</strong></div>
            <ul className="space-y-1 list-disc list-inside text-blue-700">
              <li>Our team reviews your request within 24 hours</li>
              <li>We may suggest changes to fabric, color, or details</li>
              <li>You will confirm or decline any suggested changes</li>
              <li>Production begins after your confirmation & our approval</li>
              <li>Estimated delivery: {design.productionTime} days after production starts</li>
            </ul>
          </div>
          <div className="flex gap-3 justify-center">
            <Link href="/user/orders" className="px-6 py-3 bg-rose-500 text-white font-semibold rounded-full hover:bg-rose-600 transition-colors">Track Orders</Link>
            <Link href="/collections" className="px-6 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-full hover:border-rose-300 transition-colors">Continue Shopping</Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-24 min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{customRequest ? 'Order Your Custom Design' : `Request Design: ${design.name}`}</h1>
          {customRequest && (
            <div className="mb-4 px-4 py-3 bg-purple-50 border border-purple-200 rounded-xl text-sm text-purple-800 flex items-start gap-2">
              <span className="shrink-0">✅</span>
              <span>Your custom design request was <strong>approved</strong>. Now select your fabric, measurements, and delivery options to place your order.</span>
            </div>
          )}

          {/* Steps */}
          <div className="flex items-center gap-0">
            {steps.map((step, i) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${i < currentStep ? 'bg-green-500 text-white' : i === currentStep ? 'bg-rose-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                    {i < currentStep ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`text-sm font-medium hidden sm:block ${i === currentStep ? 'text-rose-600' : i < currentStep ? 'text-green-600' : 'text-gray-400'}`}>{step}</span>
                </div>
                {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${i < currentStep ? 'bg-green-300' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {currentStep === 0 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="font-bold text-gray-900 text-lg mb-6">Fabric & Style Options</h2>

                <div className="mb-6">
                  <label className="block font-semibold text-gray-700 mb-3">Select Fabric</label>

                  {/* Admin restriction banner */}
                  {customRequest && adminSuggestedFabrics.length > 0 && !isProvideOwnFabric && (
                    <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      Fabric selection is limited to options approved by our admin for your custom design.
                    </div>
                  )}

                  {isProvideOwnFabric ? (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <div className="flex items-start gap-3">
                        <Package className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-semibold text-blue-800 text-sm mb-1">You selected: Provide Own Fabric</p>
                          <p className="text-xs text-blue-700 mb-2">The fabric you selected during your custom design request will be used. Please deliver your fabric to our store within <strong>15 days</strong>.</p>
                          <div className="bg-white rounded-lg p-3 text-xs text-gray-700 space-y-1 border border-blue-100">
                            <p className="font-semibold text-gray-800">Store Address:</p>
                            <p>Nilkanth Fashions</p>
                            <p>Drop off your fabric and mention your order ID when delivering.</p>
                            <p className="text-blue-600 font-medium mt-1">Contact: nilkanthfashion@gmail.com</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {availableFabrics.map(f => (
                        <button key={f} onClick={() => setFabric(f)} className={`py-2.5 px-3 rounded-xl text-sm font-medium border-2 transition-all capitalize ${fabric === f ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-gray-100 text-gray-600 hover:border-rose-200'}`}>{f}</button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mb-6">
                  <label className="block font-semibold text-gray-700 mb-3">Fabric Source</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {([['nilkanth-sources', '🛍️ Nilkanth Sources Fabric', 'We source and provide the fabric (cost included in price)'], ['self-provided', '✂️ I Provide My Own Fabric', 'You bring the fabric to us for tailoring only']] as const).map(([val, label, desc]) => (
                      <button key={val} onClick={() => setFabricSource(val)} className={`p-4 rounded-xl border-2 text-left transition-all ${fabricSource === val ? 'border-rose-500 bg-rose-50' : 'border-gray-100 hover:border-rose-200'}`}>
                        <div className="font-semibold text-gray-800 text-sm mb-1">{label}</div>
                        <div className="text-xs text-gray-500">{desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-2">Special Instructions</label>
                  <textarea value={specialInstructions} onChange={e => setSpecialInstructions(e.target.value)} rows={3} placeholder="Any special requirements, embellishments, color preferences..." className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none text-gray-800" />
                </div>
              </motion.div>
            )}

            {currentStep === 1 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="font-bold text-gray-900 text-lg mb-6">Measurements</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {(['standard', 'custom'] as const).map(type => (
                    <button key={type} onClick={() => setSizeType(type)} className={`p-4 rounded-xl border-2 text-left transition-all ${sizeType === type ? 'border-rose-500 bg-rose-50' : 'border-gray-100 hover:border-rose-200'}`}>
                      <div className="font-semibold text-gray-800 text-sm mb-1 capitalize">{type} {type === 'standard' ? 'Size' : 'Measurements'}</div>
                      <div className="text-xs text-gray-500">{type === 'standard' ? 'Choose from XS–XXXL standard sizes' : 'Provide exact measurements for perfect fit'}</div>
                    </button>
                  ))}
                </div>

                {sizeType === 'standard' ? (
                  <div>
                    <label className="block font-semibold text-gray-700 mb-3">Select Size</label>
                    <div className="flex flex-wrap gap-3">
                      {standardSizes.map(size => (
                        <button key={size} onClick={() => setStandardSize(size)} className={`w-14 h-14 rounded-xl font-bold border-2 transition-all ${standardSize === size ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-gray-200 text-gray-700 hover:border-rose-200'}`}>{size}</button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="font-semibold text-gray-700">Custom Measurements (inches)</label>
                      {userProfile?.measurements?.bust && (
                        <button onClick={() => {
                          const m = userProfile.measurements as Record<string, any>;
                          const filled: Record<string, string> = {};
                          measurementFields.forEach(f => { if (m[f]) filled[f] = String(m[f]); });
                          setMeasurements(filled);
                          toast.success('Measurements loaded from profile!');
                        }} className="text-sm text-rose-600 font-medium hover:text-rose-700">
                          Load from profile
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {measurementFields.map(field => (
                        <div key={field}>
                          <label className="text-xs font-medium text-gray-600 mb-1 block">{measurementLabels[field]}</label>
                          <div className="relative">
                            <input type="number" step="0.5" min="0" value={measurements[field] || ''} onChange={e => setMeasurements(prev => ({ ...prev, [field]: e.target.value }))} placeholder="0" className="w-full pl-3 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300 text-sm text-gray-800" />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">in</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="font-bold text-gray-900 text-lg mb-6">Delivery Options</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {([['home-delivery', '🚚 Home Delivery', `Delivered to your address. Charges: $${deliveryCharges.national}`], ['pickup', '🏪 Pickup', 'Pick up from our location. No delivery charge.']] as const).map(([val, label, desc]) => (
                    <button key={val} onClick={() => setDeliveryMethod(val)} className={`p-4 rounded-xl border-2 text-left transition-all ${deliveryMethod === val ? 'border-rose-500 bg-rose-50' : 'border-gray-100 hover:border-rose-200'}`}>
                      <div className="font-semibold text-gray-800 text-sm mb-1">{label}</div>
                      <div className="text-xs text-gray-500">{desc}</div>
                    </button>
                  ))}
                </div>

                {deliveryMethod === 'home-delivery' && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-700">Delivery Address</h3>
                    <div>
                      <label className="text-sm font-medium text-gray-600 mb-1 block">Street Address</label>
                      <input type="text" value={address.street} onChange={e => setAddress(prev => ({ ...prev, street: e.target.value }))} placeholder="123 Main St, Apt 4B" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 text-gray-800" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600 mb-1 block">City</label>
                        <input type="text" value={address.city} onChange={e => setAddress(prev => ({ ...prev, city: e.target.value }))} placeholder="Toronto" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 text-gray-800" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600 mb-1 block">Province</label>
                        <select value={address.province} onChange={e => setAddress(prev => ({ ...prev, province: e.target.value }))} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 text-gray-800 bg-white">
                          <option value="">Select</option>
                          {['Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Ontario', 'Quebec', 'Saskatchewan'].map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 mb-1 block">Postal Code</label>
                      <input type="text" value={address.postalCode} onChange={e => setAddress(prev => ({ ...prev, postalCode: e.target.value }))} placeholder="M5V 3A8" maxLength={7} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 text-gray-800 uppercase" />
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="font-bold text-gray-900 text-lg mb-6">Review Your Order</h2>

                <div className="flex gap-4 p-4 bg-gray-50 rounded-xl mb-6">
                  <div className="relative w-20 h-24 rounded-xl overflow-hidden shrink-0">
                    <Image src={design.images[0]} alt={design.name} fill className="object-cover" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{design.name}</h3>
                    <p className="text-sm text-gray-500 capitalize mt-1">{design.category.replace(/-/g, ' ')}</p>
                    <p className="text-sm text-gray-600 mt-1">Fabric: <span className="font-medium capitalize">{fabric}</span></p>
                    <p className="text-sm text-gray-600">Size: <span className="font-medium">{sizeType === 'standard' ? standardSize : 'Custom measurements'}</span></p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  <div className="text-sm text-blue-800">
                    <strong>Important:</strong> This is a tailoring order request. The estimated price shown is approximate.
                    Our admin will confirm the final price before production begins. You will be notified for approval.
                  </div>
                </div>

                {specialInstructions && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-400 mb-1">Special Instructions</p>
                    <p className="text-sm text-gray-700">{specialInstructions}</p>
                  </div>
                )}

                <div className="space-y-2 text-sm">
                  {[['Tailoring Cost', formatPrice(estimatedPrice)], ['Fabric Source', fabricSource === 'nilkanth-sources' ? 'Nilkanth Sourced' : 'Self-Provided'], ['Delivery', deliveryMethod === 'pickup' ? 'Pickup (Free)' : `Home Delivery (${formatPrice(deliveryCharge)})`]].map(([label, val]) => (
                    <div key={label} className="flex justify-between text-gray-600"><span>{label}</span><span className="font-medium text-gray-900">{val}</span></div>
                  ))}
                  <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-gray-900 text-base">
                    <span>Estimated Total</span>
                    <span className="text-rose-600">{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="text-xs text-gray-400 text-right">*Admin may adjust final price</div>
                </div>
              </motion.div>
            )}

            {/* Navigation */}
            <div className="flex gap-3">
              {currentStep > 0 && (
                <Button variant="outline" onClick={() => setCurrentStep(s => s - 1)} size="lg">← Previous</Button>
              )}
              {currentStep < 3 ? (
                <Button onClick={() => setCurrentStep(s => s + 1)} size="lg" className="flex-1">
                  Next Step <ChevronRight className="w-5 h-5" />
                </Button>
              ) : (
                <Button onClick={handleSubmitOrder} loading={submitting} size="lg" className="flex-1">
                  <Package className="w-5 h-5" /> Submit Order
                </Button>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-28">
              <h3 className="font-bold text-gray-900 mb-4">Order Summary</h3>
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-4 bg-gray-100">
                <Image src={design.images[0]} alt={design.name} fill className="object-cover" />
              </div>
              <h4 className="font-semibold text-gray-900 text-sm mb-1">{design.name}</h4>
              <div className="text-xs text-gray-400 capitalize mb-4">{design.category.replace(/-/g, ' ')}</div>

              <div className="space-y-2 text-sm border-t border-gray-100 pt-4">
                <div className="flex justify-between text-gray-600"><span>Est. Tailoring</span><span className="font-medium">{formatPrice(estimatedPrice)}</span></div>
                <div className="flex justify-between text-gray-600"><span>Delivery</span><span className="font-medium">{deliveryMethod === 'pickup' ? 'Free' : formatPrice(deliveryCharge)}</span></div>
                <div className="flex justify-between font-bold text-gray-900 text-base border-t border-gray-100 pt-2">
                  <span>Est. Total</span>
                  <span className="text-rose-600">{formatPrice(totalPrice)}</span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-amber-50 rounded-xl">
                <div className="flex items-center gap-2 text-amber-700 text-xs">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>Est. production: <strong>{design.productionTime} days</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
